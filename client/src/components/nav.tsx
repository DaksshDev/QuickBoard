import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/hooks/use-auth";
import { Terminal, Settings, LogOut, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export function Nav() {
  const { user, logout } = useAuthContext();
  const [location] = useLocation();

  const isHome = location === "/";

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-2 rounded-md hover:bg-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-lg">QuickBoard</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-muted-foreground font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {user.username}
          </div>

          <Link 
            href="/settings"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button 
            onClick={logout}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
