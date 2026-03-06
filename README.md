# Quick-Board
Simple, secure real-time clipboard sharing.


## Firebase Security Rules

Copy these into your Firebase Console to ensure the app works correctly and stays secure.

### Cloud Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Users collection
    match /users/{userId} {
      // Allow read to all authenticated users so they can see usernames/profiles
      allow read: if request.auth != null;
      // Allow write only to the owner
      allow write, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // 2. Clipboards collection (Metadata)
    match /clipboards/{boardId} {
      // Allow read to all authenticated users for search and validation
      allow read: if request.auth != null;
      // Allow creation if the board doesn't exist
      allow create: if request.auth != null && !exists(/databases/$(database)/documents/clipboards/$(boardId));
      // Only the owner can update (e.g. rename or sanitize) or delete
      allow update, delete: if request.auth != null && resource.data.createdByHash == request.auth.uid;
    }
  }
}
```

### Realtime Database Rules

```json
{
  "rules": {
    "clipboards": {
      "$boardId": {
        // Allow write if the board is being deleted by owner or created/updated by owner
        ".write": "auth != null && (!data.exists() || data.child('meta/createdByHash').val() == auth.uid)",
        ".read": "auth != null",
        "meta": {
          ".read": "auth != null",
          ".write": "auth != null && (!data.exists() || data.child('createdByHash').val() == auth.uid)"
        },
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## Security & Deployment

- **Identity**: Based on deterministic SHA-256 hashes of usernames.
- **SPA Routing**: Use the included `_redirects` for Netlify.
- **Console Warning**: A protection script is embedded in `index.html`.
