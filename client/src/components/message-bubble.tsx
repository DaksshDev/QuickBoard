import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/hooks/use-messages";
import { useAuthContext } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Copy, Check, Trash2 } from "lucide-react";

// CodeBlock component with its own copy button
const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg bg-black/40 border border-white/10 overflow-hidden group/code relative">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Code</span>
        <button 
          onClick={handleCopy}
          className="text-muted-foreground hover:text-white transition-colors p-1"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Updated linkifier and markdown-lite formatter
const formatMessageText = (text: string) => {
  // First, split by code blocks: ```code```
  const codeRegex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    // Add code block
    parts.push({ type: 'code', content: match[1].trim() });
    lastIndex = codeRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return parts.map((part, i) => {
    if (part.type === 'code') {
      return <CodeBlock key={i} code={part.content} />;
    }

    // Process URLs in regular text
    const textParts = part.content.split(urlRegex);
    return (
      <span key={i}>
        {textParts.map((t, j) => {
          if (urlRegex.test(t)) {
            return (
              <a 
                key={j} 
                href={t} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 break-all"
              >
                {t}
              </a>
            );
          }
          return <span key={j} className="break-words whitespace-pre-wrap">{t}</span>;
        })}
      </span>
    );
  });
};

export function MessageBubble({ 
  message, 
  onProfileClick,
  isGrouped = false,
  onDelete
}: { 
  message: Message, 
  onProfileClick: (uid: string) => void,
  isGrouped?: boolean,
  onDelete?: (id: string) => void
}) {
  const { user } = useAuthContext();
  const [senderName, setSenderName] = useState<string | null>(null);
  const [messageCopied, setMessageCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  useEffect(() => {
    if (isGrouped) return;
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
      className={`flex flex-col w-full group ${isGrouped ? 'py-0.5' : 'py-2 mt-4'}`}
    >
      {!isGrouped && (
        <div className="flex items-center gap-2 px-1 mb-1 relative">
          <span 
            onClick={() => message.senderHash !== 'deleted_user' && onProfileClick(message.senderHash)}
            className={`text-xs font-bold text-white/90 ${message.senderHash !== 'deleted_user' ? 'cursor-pointer hover:underline underline-offset-2' : ''}`}
          >
            {senderName || '...'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 rounded bg-white/5 border border-white/5">
            {message.senderHash === 'deleted_user' ? '...' : message.senderHash.substring(0, 6)}
          </span>
          <span className="text-[10px] text-muted-foreground group-hover:opacity-100 opacity-0 transition-opacity whitespace-nowrap">
            {message.timestamp ? formatDistanceToNow(message.timestamp, { addSuffix: true }) : 'just now'}
          </span>
        </div>
      )}
      
      <div className="px-1 text-white/90 relative flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
              {formatMessageText(message.content)}
            </p>
            
            {/* Actions & Timestamp */}
            <div className="absolute -right-2 -top-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 z-10">
              {isGrouped && (
                <span className="text-[10px] text-muted-foreground bg-black/80 px-1.5 py-0.5 rounded backdrop-blur">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                </span>
              )}
              <div className="flex items-center gap-0.5 bg-[#1a1a1a] shadow-lg rounded p-0.5 border border-white/10">
                {onDelete && message.senderHash === user?.uid && (
                  <button 
                    onClick={() => onDelete(message.id)}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-white/5 rounded transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={handleCopyMessage}
                  className="p-1 text-muted-foreground hover:text-white hover:bg-white/5 rounded transition-colors"
                  title="Copy message"
                >
                  {messageCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
