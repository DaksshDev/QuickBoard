import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Nav } from "@/components/nav";
import { useClipboardMeta } from "@/hooks/use-clipboards";
import { useMessages } from "@/hooks/use-messages";
import { MessageBubble } from "@/components/message-bubble";
import { Loader2, Send, AlertTriangle, Hash, Copy, Check, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, BookOpen, ExternalLink } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from "@/hooks/use-auth";
import { useClipboards } from "@/hooks/use-clipboards";
import { useLocation } from "wouter";

export default function ClipboardView() {
  const { id } = useParams<{ id: string }>();
  const { meta, loading: metaLoading, error } = useClipboardMeta(id || "");
  const { messages, loading: messagesLoading, sendMessage, deleteMessage } = useMessages(id || "");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { leaveBoard } = useClipboards();
  const [, setLocation] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<{uid: string, username: string}[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{username: string, ownedBoards: string[]} | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelectionInCode = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const selectedText = content.substring(selectionStart, selectionEnd);
    const newContent = 
      content.substring(0, selectionStart) + 
      "```\n" + selectedText + "\n```" + 
      content.substring(selectionEnd);
    
    setContent(newContent);
    // Refocus and set selection after state update (using a small timeout or just relying on focus)
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages.length]);

  const handleLeave = async () => {
    await leaveBoard(id || "");
    toast({ title: "Left group", description: `You have left ${meta?.name}` });
    setLocation("/");
  };

  const fetchMembers = async () => {
    if (!id) return;
    const q = query(collection(db, 'users'), where('joinedBoards', 'array-contains', id.toUpperCase()));
    const snap = await getDocs(q);
    const m = snap.docs.map(d => ({ uid: d.id, username: d.data().username }));
    setMembers(m);
    setShowMembers(true);
  };

  const openProfile = async (uid: string) => {
    if (uid === 'deleted_user') return;
    setSelectedProfile(uid);
    setProfileData(null);
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        // Fetch boards created by this user
        const q = query(collection(db, 'clipboards'), where('createdByHash', '==', uid));
        const boardsSnap = await getDocs(q);
        const owned = boardsSnap.docs.map(d => d.data().name);
        setProfileData({ username: data.username, ownedBoards: owned });
      } else {
        setProfileData({ username: '[DELETED USER]', ownedBoards: [] });
      }
    } catch (err) {
      console.error("Error fetching profile", err);
      setProfileData({ username: '[DELETED USER]', ownedBoards: [] });
    }
  };

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
            <p className="text-xs text-muted-foreground mt-0.5">
              Owner: {meta.createdByHash === 'deleted_user' ? '[DELETED USER]' : `Hash ${meta.createdByHash.substring(0, 8)}...`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchMembers}
              className="text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLeave}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
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
      </div>

      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription className="text-muted-foreground">List of users who joined this clipboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto pr-2">
            {members.map(m => (
              <div 
                key={m.uid} 
                onClick={() => { setShowMembers(false); openProfile(m.uid); }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs uppercase">
                    {m.username[0]}
                  </div>
                  <div>
                    <div className="font-medium">{m.username}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{m.uid.substring(0, 10)}...</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/20" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {!profileData ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="space-y-6 pt-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-3xl font-bold mb-4">
                    {profileData.username === '[DELETED USER]' ? '?' : profileData.username[0].toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold">{profileData.username}</h2>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {profileData.username === '[DELETED USER]' ? '...' : selectedProfile}
                  </p>
                </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Owned Clipboards
                </h3>
                <div className="grid gap-2">
                  {profileData.ownedBoards.length > 0 ? (
                    profileData.ownedBoards.map((b, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
                        {b}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic px-1">This user hasn't created any boards yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Leave Clipboard?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You won't see "{meta.name}" in your recent boards anymore. You'll need the Board ID to join again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="ghost" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave}>
              Leave Board
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages Area */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6 flex flex-col min-h-full">
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
            messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isGrouped = prevMsg && 
                prevMsg.senderHash === msg.senderHash && 
                msg.timestamp && prevMsg.timestamp &&
                (msg.timestamp - prevMsg.timestamp < 300000); // 5 mins

              return (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onProfileClick={openProfile}
                  isGrouped={!!isGrouped} 
                  onDelete={deleteMessage}
                />
              );
            })
          )}
          <div className="h-[150px] shrink-0" />
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent pt-12 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          {/* Toolbar */}
          <div className="flex gap-1 mb-2 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={wrapSelectionInCode}
              title="Wrap selection in code block"
              className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>
          
          <form 
            onSubmit={handleSubmit}
            className="p-1.5 bg-[#111] border border-white/10 rounded-2xl flex items-end gap-2 vercel-shadow backdrop-blur-xl"
          >
            <Textarea
              ref={textareaRef}
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
