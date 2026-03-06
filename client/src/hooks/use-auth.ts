import { useState, useEffect, createContext, useContext } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, remove, update } from 'firebase/database';
import { auth, db, rtdb, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from './use-toast';

export interface QuickBoardUser {
  uid: string;
  username: string;
  usernameHash: string;
  joinedBoards?: string[];
}

// Helper to generate SHA-256 hash natively
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: QuickBoardUser | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (deleteClipboards: boolean) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function useAuthInit(): AuthContextType {
  const [user, setUser] = useState<QuickBoardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeDoc) unsubscribeDoc();

      if (firebaseUser) {
        // Real-time listener for user document
        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as QuickBoardUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore listener error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (username: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");

    const formattedUsername = username.trim().toLowerCase();
    if (formattedUsername.length < 3) throw new Error("Username must be at least 3 characters");

    const hash = await sha256(formattedUsername);
    const email = `${formattedUsername}@quickboardhashed.sh`;
    const password = hash; // Using the hash as the password

    try {
      // 1. Try to sign in first
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return; // Success
      } catch (signInErr: any) {
        // If user doesn't exist, create it
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          // Double check Firestore just in case Auth and Firestore are out of sync 
          // (though with deterministic emails this is unlikely unless someone else used the name)
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCred.user.uid), {
            username: formattedUsername,
            usernameHash: hash,
            createdAt: new Date().toISOString(),
            joinedBoards: []
          });
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error("Username is already taken");
      }
      throw new Error(err.message || "Authentication failed");
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    try {
      await signOut(auth);
      setUser(null);
      toast({ title: "Signed out", description: "You have been logged out." });
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const reauth = async (currentUsername: string) => {
    if (!auth.currentUser) throw new Error("No user found");
    const hash = await sha256(currentUsername);
    const email = `${currentUsername}@quickboardhashed.sh`;
    const credential = EmailAuthProvider.credential(email, hash);
    return await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const deleteAccount = async (deleteClipboards: boolean) => {
    if (!isFirebaseConfigured || !auth.currentUser || !user) return;
    try {
      // Automatic re-auth using current session username
      await reauth(user.username);

      const uid = auth.currentUser.uid;

      // 1. Find all clipboards owned by this user
      const q = query(collection(db, 'clipboards'), where('createdByHash', '==', uid));
      const ownedClipboards = await getDocs(q);

      if (deleteClipboards) {
        // Delete all owned clipboards
        const batch = writeBatch(db);
        for (const boardDoc of ownedClipboards.docs) {
          const boardId = boardDoc.id;
          // Delete from Firestore
          batch.delete(boardDoc.ref);
          // Delete from RTDB
          await remove(ref(rtdb, `clipboards/${boardId}`));
        }
        await batch.commit();
      } else {
        // Sanitize owner in owned clipboards
        const batch = writeBatch(db);
        for (const boardDoc of ownedClipboards.docs) {
          const boardId = boardDoc.id;
          // Update Firestore
          batch.update(boardDoc.ref, { createdByHash: 'deleted_user' });
          // Update RTDB
          await update(ref(rtdb, `clipboards/${boardId}/meta`), { createdByHash: 'deleted_user' });
        }
        await batch.commit();
      }

      // 2. Delete Firestore user document
      await deleteDoc(doc(db, 'users', uid));
      // 3. Delete Auth user
      await deleteUser(auth.currentUser);

      setUser(null);
      toast({ title: "Account Deleted", description: "Your data has been removed." });
    } catch (error: any) {
      console.error("Delete account error", error);
      throw new Error(error.message || "Failed to delete account");
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!isFirebaseConfigured || !user || !auth.currentUser) return;

    const formatted = newUsername.trim().toLowerCase();
    if (formatted === user.username) return;
    if (formatted.length < 3) throw new Error("Username must be at least 3 characters");

    // Check if taken
    const q = query(collection(db, 'users'), where('username', '==', formatted));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error("Username is already taken");

    // Automatic re-auth before email/username change
    await reauth(user.username);

    const hash = await sha256(formatted);
    const newEmail = `${formatted}@quickboardhashed.sh`;

    // 1. Update Email in Auth first (this keeps things deterministic)
    await updateEmail(auth.currentUser, newEmail);

    // 2. Update Firestore
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      username: formatted,
      usernameHash: hash
    }, { merge: true });

    toast({ title: "Username updated", description: `You are now ${formatted}` });
  };

  return { user, loading, login, logout, deleteAccount, updateUsername };
}
