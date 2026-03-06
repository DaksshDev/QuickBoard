import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Nav } from "@/components/nav";
import { useClipboardMeta } from "@/hooks/use-clipboards";
import { useMessages } from "@/hooks/use-messages";
import { MessageBubble } from "@/components/message-bubble";
import { Loader2, Send, AlertTriangle, Hash, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function ClipboardView() {
  const { id } = useParams<{ id: string }>();
  const { meta, loading: metaLoading, error } = useClipboardMeta(id || "");
  const { messages, loading: messagesLoading, sendMessage } = useMessages(id || "");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const text = content;
    setContent(""); // optimistically clear
    try {
      await sendMessage(text);
    } catch (err) {
      setContent(text); // revert on failure
      toast({ title: "Failed to send", variant: "destructive" });
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "ID Copied to clipboard" });
  };

  if (metaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Nav />
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Clipboard Not Found</h1>
        <p className="text-muted-foreground mb-8">The clipboard {id} does not exist or was deleted.</p>
        <Link href="/">
          <Button variant="outline" className="border-white/20 hover:bg-white/10">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      
      {/* Header Info */}
      <div className="pt-14 shrink-0 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white/90">{meta.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Created by {meta.createdBy}</p>
          </div>
          <button 
            onClick={copyId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-bold tracking-widest">{id}</span>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-6 flex flex-col">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-white/20" />
              </div>
              <p>This clipboard is empty.</p>
              <p className="text-sm mt-1 opacity-60">Send a message to start sharing.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent pt-12 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          <form 
            onSubmit={handleSubmit}
            className="p-1.5 bg-[#111] border border-white/10 rounded-2xl flex items-end gap-2 vercel-shadow backdrop-blur-xl"
          >
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Paste or type something... (Enter to send)"
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 px-4 py-3.5 text-[15px] placeholder:text-muted-foreground shadow-none"
            />
            <Button 
              type="submit" 
              disabled={!content.trim()}
              size="icon"
              className="h-[42px] w-[42px] shrink-0 rounded-xl bg-white text-black hover:bg-white/90 mb-1 mr-1 disabled:opacity-30 disabled:bg-white/20 disabled:text-white"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
