import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as QuickBoardUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    
    const formattedUsername = username.trim().toLowerCase();
    if (formattedUsername.length < 3) throw new Error("Username must be at least 3 characters");

    const hash = await sha256(formattedUsername);
    const email = `${formattedUsername}@quickboardhashed.sh`;
    const password = hash; // Using the hash as the password

    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If user doesn't exist, create them
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCred.user.uid), {
            username: formattedUsername,
            usernameHash: hash,
            createdAt: new Date().toISOString()
          });
        } catch (createError: any) {
          throw new Error(createError.message || "Failed to create user");
        }
      } else {
        throw new Error(error.message || "Login failed");
      }
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

  return { user, loading, login, logout };
}
