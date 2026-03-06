import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/hooks/use-messages";
import { useAuthContext } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Simple custom linkifier to avoid external dependencies breaking
const formatMessageText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i} className="break-words whitespace-pre-wrap">{part}</span>;
  });
};

export function MessageBubble({ 
  message, 
  onProfileClick,
  isGrouped = false
}: { 
  message: Message, 
  onProfileClick: (uid: string) => void,
  isGrouped?: boolean
}) {
  const { user } = useAuthContext();
  const [senderName, setSenderName] = useState<string | null>(null);

  useEffect(() => {
    if (isGrouped) return; // Don't fetch if grouped
    if (message.senderHash === 'deleted_user') {
      setSenderName('[DELETED USER]');
      return;
    }

    const fetchSender = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', message.senderHash));
        if (snap.exists()) {
          setSenderName(snap.data().username);
        } else {
          setSenderName('[DELETED USER]');
        }
      } catch (err) {
        console.error("Error resolving sender", err);
        setSenderName('[DELETED USER]');
      }
    };
    fetchSender();
  }, [message.senderHash, isGrouped]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col w-full group ${isGrouped ? 'py-0.5' : 'py-2 mt-2'}`}
    >
      {!isGrouped && (
        <div className="flex items-center gap-2 px-1 mb-1">
          <span 
            onClick={() => message.senderHash !== 'deleted_user' && onProfileClick(message.senderHash)}
            className={`text-xs font-bold text-white/90 ${message.senderHash !== 'deleted_user' ? 'cursor-pointer hover:underline underline-offset-2' : ''}`}
          >
            {senderName || '...'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 rounded bg-white/5 border border-white/5">
            {message.senderHash === 'deleted_user' ? '...' : message.senderHash.substring(0, 6)}
          </span>
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {message.timestamp ? formatDistanceToNow(message.timestamp, { addSuffix: true }) : 'just now'}
          </span>
        </div>
      )}
      
      <div className="px-1 text-white/90 relative flex items-start gap-2">
        {isGrouped && (
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity w-10 shrink-0 pt-1 text-right">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {formatMessageText(message.content)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
