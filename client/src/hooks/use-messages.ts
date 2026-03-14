import { useState, useEffect } from 'react';
import { ref, onValue, push, set, serverTimestamp, off, remove } from 'firebase/database';
import { rtdb, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthContext } from './use-auth';

export interface Message {
  id: string;
  content: string;
  senderHash: string;
  timestamp: number;
  fileUrl?: string;     // Generic URL for any file including images
  fileName?: string;
  fileType?: string;    // 'image/jpeg', 'video/mp4', 'application/pdf', etc.
  fileSize?: number;    // Size in bytes
  filePublicId?: string;
  fileResourceType?: string;
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
        })).sort((a, b) => a.timestamp - b.timestamp);
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

  const sendMessage = async (
    content: string, 
    fileData?: { url: string; name: string; type: string; size: number, publicId: string, resourceType: string }
  ) => {
    if (!isFirebaseConfigured || !user || !clipboardId || (!content.trim() && !fileData)) return;

    const messagesRef = ref(rtdb, `clipboards/${clipboardId}/messages`);
    const newMsgRef = push(messagesRef);

    const payload: Omit<Message, 'id'> = {
      content: content.trim(),
      senderHash: user.uid,
      timestamp: serverTimestamp() as any
    };

    if (fileData) {
      payload.fileUrl = fileData.url;
      payload.fileName = fileData.name;
      payload.fileType = fileData.type;
      payload.fileSize = fileData.size;
      payload.filePublicId = fileData.publicId;
      payload.fileResourceType = fileData.resourceType;
    }

    await set(newMsgRef, payload);
  };

  const deleteMessage = async (messageId: string) => {
    if (!isFirebaseConfigured || !user || !clipboardId) return;
    
    const msgToDelete = messages.find(m => m.id === messageId);
    if (msgToDelete?.filePublicId && msgToDelete?.fileResourceType) {
      try {
        const { deleteImageFromCloudinary } = await import('@/lib/cloudinary');
        await deleteImageFromCloudinary(msgToDelete.filePublicId, msgToDelete.fileResourceType);
      } catch (err) {
        console.error("Failed to delete Cloudinary asset:", err);
      }
    }

    const msgRef = ref(rtdb, `clipboards/${clipboardId}/messages/${messageId}`);
    await remove(msgRef);
  };

  return { messages, loading, sendMessage, deleteMessage };
}
