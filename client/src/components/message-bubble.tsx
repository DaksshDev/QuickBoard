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
      className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
    >
      <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xs font-semibold text-white/80">
          {isMe ? 'You' : message.username}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
          {message.usernameHash.substring(0, 6)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {message.createdAt ? formatDistanceToNow(message.createdAt, { addSuffix: true }) : 'just now'}
        </span>
      </div>
      
      <div 
        className={`px-4 py-3 rounded-2xl ${
          isMe 
            ? 'bg-white text-black rounded-tr-sm' 
            : 'bg-[#1A1A1A] border border-white/5 text-white rounded-tl-sm'
        }`}
      >
        <p className="text-[15px] leading-relaxed">
          {formatMessageText(message.content)}
        </p>
      </div>
    </motion.div>
  );
}
