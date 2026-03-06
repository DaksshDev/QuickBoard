import { useState } from "react";
import { useLocation } from "wouter";
import { useClipboards } from "@/hooks/use-clipboards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBoardModal({ open, onOpenChange, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [customId, setCustomId] = useState("");
  const { createClipboard, isCreating } = useClipboards();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGenerateId = () => {
    setCustomId(Math.random().toString(36).substring(2, 6).toUpperCase());
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const id = await createClipboard(name.trim(), customId.trim() || undefined);
      toast({
        title: "Clipboard Created",
        description: `Successfully created ${id}`,
      });
      onOpenChange(false);
      setName("");
      setCustomId("");
      if (onSuccess) onSuccess();
      setLocation(`/c/${id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not create clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">New Clipboard</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a real-time space to share text, links, and snippets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">Clipboard Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Project Links, Daily Notes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-white/20 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white h-11"
              autoFocus
              required
              maxLength={50}
            />
            <p className="text-[11px] text-muted-foreground">Name will be publicly visible in search.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id" className="text-white/80">Custom ID (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="id"
                placeholder="4-char code"
                value={customId}
                onChange={(e) => setCustomId(e.target.value.toUpperCase())}
                maxLength={4}
                className="bg-black border-white/20 focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white h-11 font-mono uppercase tracking-widest"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 border-white/20 hover:bg-white/10 px-3"
                onClick={handleGenerateId}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Leave blank to auto-generate a random 4-character ID.</p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-white/5 border-transparent"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isCreating}
              className="bg-white text-black hover:bg-white/90 font-medium px-6"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
