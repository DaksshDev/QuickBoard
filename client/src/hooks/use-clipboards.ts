import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, arrayUnion, updateDoc } from 'firebase/firestore';
import { ref, set, get } from 'firebase/database';
import { db, rtdb, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthContext } from './use-auth';

export interface ClipboardMeta {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

export function useClipboards() {
  const { user } = useAuthContext();
  const [isCreating, setIsCreating] = useState(false);

  const joinBoard = async (id: string) => {
    if (!isFirebaseConfigured || !user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      joinedBoards: arrayUnion(id.toUpperCase())
    });
  };

  const createClipboard = async (name: string, customId?: string): Promise<string> => {
    if (!isFirebaseConfigured || !user) throw new Error("Not authenticated or configured");
    
    setIsCreating(true);
    try {
      // Generate ID if not provided: 4 random alphanumeric uppercase chars
      let id = customId?.toUpperCase();
      if (!id) {
        id = Math.random().toString(36).substring(2, 6).toUpperCase();
      }

      // Check if exists in Firestore to prevent overwrite
      const docRef = doc(db, 'clipboards', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        throw new Error("Clipboard ID already exists");
      }

      const timestamp = Date.now();
      const meta = {
        name,
        createdBy: user.username,
        createdByHash: user.usernameHash,
        createdAt: timestamp,
      };

      // 1. Store metadata in Firestore (for easy search)
      await setDoc(docRef, meta);

      // 2. Store base metadata in RTDB
      await set(ref(rtdb, `clipboards/${id}/meta`), meta);

      // 3. Add to user's joined boards
      await joinBoard(id);

      return id;
    } finally {
      setIsCreating(false);
    }
  };

  const searchClipboards = async (searchQuery: string): Promise<ClipboardMeta[]> => {
    if (!isFirebaseConfigured || !searchQuery.trim()) return [];
    
    const term = searchQuery.trim();
    // Simple prefix search trick in Firestore
    const q = query(
      collection(db, 'clipboards'),
      where('name', '>=', term),
      where('name', '<=', term + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClipboardMeta));
  };

  return { createClipboard, searchClipboards, joinBoard, isCreating };
}

export function useClipboardMeta(id: string) {
  const [meta, setMeta] = useState<ClipboardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !id) return;

    let mounted = true;
    const fetchMeta = async () => {
      try {
        setLoading(true);
        // We can fetch from RTDB directly since we are on the clipboard page
        const metaRef = ref(rtdb, `clipboards/${id}/meta`);
        const snapshot = await get(metaRef);
        
        if (snapshot.exists() && mounted) {
          setMeta({ id, ...snapshot.val() });
          setError(null);
        } else if (mounted) {
          setError("Clipboard not found");
          setMeta(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMeta();
    return () => { mounted = false; };
  }, [id]);

  return { meta, loading, error };
}

export function useJoinedBoards() {
  const { user } = useAuthContext();
  const [boards, setBoards] = useState<ClipboardMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.joinedBoards?.length) {
      setBoards([]);
      setLoading(false);
      return;
    }

    const fetchBoards = async () => {
      try {
        const boardDocs = await Promise.all(
          user.joinedBoards!.map(id => getDoc(doc(db, 'clipboards', id)))
        );
        const fetchedBoards = boardDocs
          .filter(d => d.exists())
          .map(d => ({ id: d.id, ...d.data() } as ClipboardMeta));
        setBoards(fetchedBoards);
      } catch (err) {
        console.error("Error fetching joined boards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user?.joinedBoards]);

  return { boards, loading };
}
