import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChevronRight, Hash, Clock, Github } from "lucide-react";
import { Nav } from "@/components/nav";
import { CreateBoardModal } from "@/components/create-board-modal";
import { useClipboards, useJoinedBoards, ClipboardMeta } from "@/hooks/use-clipboards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [directId, setDirectId] = useState("");
  const [results, setResults] = useState<ClipboardMeta[]>([]);
  const [verifyingBoard, setVerifyingBoard] = useState<ClipboardMeta | null>(null);
  const [verificationId, setVerificationId] = useState("");
  const { searchClipboards, joinBoard } = useClipboards();
  const { boards: joinedBoards, loading: joinedLoading, refresh: refreshJoined } = useJoinedBoards();
  const [, setLocation] = useLocation();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const res = await searchClipboards(searchQuery);
        setResults(res);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = directId.trim().toUpperCase();
    if (id.length === 4) {
      await joinBoard(id);
      setLocation(`/c/${id}`);
    }
  };

  const handleJoinBoard = async (board: ClipboardMeta) => {
    setVerifyingBoard(board);
    setVerificationId("");
  };

  const confirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingBoard) return;
    
    if (verificationId.toUpperCase() === verifyingBoard.id.toUpperCase()) {
      await joinBoard(verifyingBoard.id);
      setLocation(`/c/${verifyingBoard.id}`);
      setVerifyingBoard(null);
    } else {
      alert("Incorrect Board ID");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />
      <CreateBoardModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={refreshJoined}
      />

      {/* Join Verification Modal */}
      <AnimatePresence>
        {verifyingBoard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">Join {verifyingBoard.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the 4-character Board ID to confirm access.
              </p>
              <form onSubmit={confirmJoin} className="space-y-4">
                <Input 
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  autoFocus
                  className="h-12 font-mono text-center text-xl uppercase tracking-[0.5em] bg-black border-white/10 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white"
                />
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setVerifyingBoard(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={verificationId.length !== 4}
                    className="flex-1 bg-white text-black hover:bg-white/90"
                  >
                    Verify & Join
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Clipboards</h1>
            <p className="text-muted-foreground text-lg">Join an existing board or create a new space.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black hover:bg-white/90 h-11 px-6 font-medium shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Board
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Join Column */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Join by ID
              </h2>
              <div className="p-1 vercel-shadow rounded-2xl bg-black/50">
                <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/5 space-y-4">
                  <p className="text-sm text-white/70">
                    Have a 4-character code? Enter it below to join directly.
                  </p>
                  <form onSubmit={handleJoinDirect} className="flex gap-2">
                    <Input 
                      value={directId}
                      onChange={(e) => setDirectId(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      maxLength={4}
                      className="h-12 font-mono text-center text-xl uppercase tracking-[0.5em] bg-black border-white/10 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white"
                    />
                    <Button 
                      type="submit"
                      disabled={directId.trim().length !== 4}
                      className="h-12 w-12 shrink-0 p-0 bg-white text-black hover:bg-white/90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Joined Boards */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Boards
              </h2>
              <div className="space-y-2">
                {joinedLoading ? (
                  <div className="text-center py-4 text-muted-foreground animate-pulse">Loading...</div>
                ) : joinedBoards.length > 0 ? (
                  joinedBoards.map((board) => (
                    <Link key={board.id} href={`/c/${board.id}`}>
                      <div className="group block p-4 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors">{board.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Hash: {board.createdByHash.substring(0, 8)}...</p>
                          </div>
                          <div className="font-mono text-sm text-white/50 bg-white/5 px-2 py-1 rounded">
                            {board.id}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground px-2 italic">No boards joined yet.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Search Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Boards
            </h2>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search public boards..."
                className="h-12 pl-10 bg-[#0a0a0a] border-white/10 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white text-base rounded-xl"
              />
            </div>

            <div className="min-h-[200px]">
              <AnimatePresence>
                {results.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {results.map((board) => (
                      <div 
                        key={board.id} 
                        onClick={() => handleJoinBoard(board)}
                        className="group block p-4 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors">{board.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Hash: {board.createdByHash.substring(0, 8)}...</p>
                          </div>
                          <div className="text-white/10 group-hover:text-white/30 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : searchQuery.length >= 2 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No boards found matching "{searchQuery}"
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2"
                  >
                    <Search className="w-8 h-8 opacity-20" />
                    <p>Start typing to discover boards</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="mt-auto py-12 border-t border-white/5 bg-black/20">
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-6 text-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50">By DaksshDev</p>
            <p className="text-xs text-muted-foreground/30">QuickBoard is Open Source</p>
          </div>
          <a 
            href="https://github.com/DaksshDev/QuickBoard" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="bg-white text-black hover:bg-white/90 font-bold h-10 px-5 rounded-lg">
              <Github className="w-4 h-4 mr-2" />
              View Source
            </Button>
          </a>
        </div>
      </footer>
    </div>
  );
}
