import { Nav } from "@/components/nav";
import { useAuthContext } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, logout } = useAuthContext();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your identity and session.</p>
          </div>

          <div className="grid gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a]">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-white/70" />
                Current Identity
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">Username</label>
                  <div className="text-xl font-medium">{user.username}</div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Cryptographic Hash
                  </label>
                  <div className="font-mono text-sm break-all p-3 rounded-lg bg-white/5 border border-white/5 text-white/80 select-all">
                    {user.usernameHash}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    This SHA-256 hash secures your pseudo-account.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Signing out will require you to type your exact username again to reconnect to this identity.
              </p>
              
              <Button 
                variant="destructive" 
                onClick={logout}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
