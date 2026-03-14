import { useState } from "react";
import { Nav } from "@/components/nav";
import { useAuthContext } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, deleteAccount, updateUsername } = useAuthContext();
  const [newUsername, setNewUsername] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteClipboards, setDeleteClipboards] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername === user.username) return;
    
    setIsUpdating(true);
    try {
      await updateUsername(newUsername);
      setNewUsername("");
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(deleteClipboards);
      setShowDeleteModal(false);
    } catch (err: any) {
      toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

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

                <form onSubmit={handleUpdateUsername} className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">Change Username</label>
                  <div className="flex gap-2">
                    <Input 
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="New username..."
                      className="bg-black border-white/10 h-10"
                    />
                    <Button type="submit" disabled={isUpdating || !newUsername.trim()} variant="secondary" className="h-10">
                      {isUpdating ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </form>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Account UID (Hash)
                  </label>
                  <div className="font-mono text-sm break-all p-3 rounded-lg bg-white/5 border border-white/5 text-white/80 select-all">
                    {user.uid}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    This stable UID identifies you across sessions.
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
                Deleting your account will permanently remove your cryptographic identity and all associated data records.
              </p>
              
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Permanent Account Deletion</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. Please confirm your preferences below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="delete-clipboards" 
                checked={deleteClipboards} 
                onCheckedChange={(checked) => setDeleteClipboards(!!checked)}
                className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label 
                htmlFor="delete-clipboards"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also delete my clipboards
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              If unchecked, your clipboards will remain but will show as owned by "[DELETED USER]".
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
