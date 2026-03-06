## Packages
firebase | Required for Authentication, Firestore, and Realtime Database
framer-motion | Smooth transitions and layout animations
date-fns | Relative time formatting for messages
lucide-react | Icons (already in base stack, but explicitly noting usage)

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  mono: ["var(--font-mono)"],
}

Firebase integration requires the following environment variables:
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

The application uses a pure dark mode (Vercel-inspired) aesthetic.
