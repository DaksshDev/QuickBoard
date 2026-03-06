import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/hooks/use-messages";
import { useAuthContext } from "@/hooks/use-auth";

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

export function MessageBubble({ message }: { message: Message }) {
  const { user } = useAuthContext();
  const isMe = user?.username === message.username;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col w-full group py-1"
    >
      <div className="flex items-center gap-2 px-1 mb-1">
        <span className="text-xs font-bold text-white/90">
          {message.username}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 rounded bg-white/5 border border-white/5">
          {message.usernameHash.substring(0, 6)}
        </span>
        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {message.createdAt ? formatDistanceToNow(message.createdAt, { addSuffix: true }) : 'just now'}
        </span>
      </div>
      
      <div className="px-1 text-white/90">
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {formatMessageText(message.content)}
        </p>
      </div>
    </motion.div>
  );
}
