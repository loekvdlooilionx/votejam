import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JoinGroupDialogProps {
  onGroupJoined: () => void;
}

export function JoinGroupDialog({ onGroupJoined }: JoinGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_group_via_code', {
        code: inviteCode.trim().toUpperCase(),
      });

      if (error) throw error;

      toast.success('Joined group successfully!');
      setInviteCode('');
      setOpen(false);
      onGroupJoined();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <UserPlus className="w-5 h-5" />
          Join Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-spotify-green" />
            Join a Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleJoin} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="inviteCode" className="text-sm text-muted-foreground">
              Invite Code
            </Label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="mt-1 bg-secondary border-0 h-12 font-mono text-center text-xl tracking-widest uppercase"
              required
              maxLength={8}
            />
          </div>

          <Button
            type="submit"
            variant="spotify"
            size="lg"
            className="w-full"
            disabled={loading || inviteCode.length < 8}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Join Group'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
