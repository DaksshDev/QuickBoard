import { useState, useEffect } from 'react';
import { ref, onValue, push, set, serverTimestamp, off } from 'firebase/database';
import { rtdb, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthContext } from './use-auth';

export interface Message {
  id: string;
  content: string;
  username: string;
  usernameHash: string;
  createdAt: number;
}

export function useMessages(clipboardId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!isFirebaseConfigured || !clipboardId) {
      setLoading(false);
      return;
    }

    const messagesRef = ref(rtdb, `clipboards/${clipboardId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })).sort((a, b) => a.createdAt - b.createdAt);
        setMessages(messageList);
      } else {
        setMessages([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => {
      off(messagesRef, 'value', unsubscribe);
    };
  }, [clipboardId]);

  const sendMessage = async (content: string) => {
    if (!isFirebaseConfigured || !user || !clipboardId || !content.trim()) return;

    const messagesRef = ref(rtdb, `clipboards/${clipboardId}/messages`);
    const newMsgRef = push(messagesRef);
    
    await set(newMsgRef, {
      content: content.trim(),
      username: user.username,
      usernameHash: user.usernameHash,
      createdAt: serverTimestamp()
    });
  };

  return { messages, loading, sendMessage };
}
