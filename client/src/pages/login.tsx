import { useState } from "react";
import { useAuthContext } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Terminal, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
      setIsSubmitting(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-card text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Configuration Missing</h2>
          <p className="text-muted-foreground">
            Firebase environment variables are missing. Please check your .env file or configuration settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">QuickBoard</h1>
          <p className="text-muted-foreground text-center">
            Real-time clipboard sharing. No password needed.
          </p>
        </div>

        <div className="p-1 vercel-shadow rounded-2xl bg-black/50 backdrop-blur-xl">
          <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/[0.05]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 bg-black border-white/10 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white text-lg px-4"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !username.trim()} 
                className="w-full h-12 bg-white text-black hover:bg-white/90 text-base font-semibold"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter"}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/60">By DaksshDev</p>
          <a 
            href="https://github.com/DaksshDev/QuickBoard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground/40 hover:text-white transition-colors underline underline-offset-4"
          >
            QuickBoard is Open Source
          </a>
        </div>
      </motion.div>
    </div>
  );
}
