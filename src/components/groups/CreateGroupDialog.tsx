import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateGroupDialogProps {
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_group_with_admin', {
        group_name: groupName.trim(),
      });

      if (error) throw error;

      toast.success('Group created successfully!');
      setGroupName('');
      setOpen(false);
      onGroupCreated();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="spotify" size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-spotify-green" />
            Create a New Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="groupName" className="text-sm text-muted-foreground">
              Group Name
            </Label>
            <Input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Team Utrecht Monday"
              className="mt-1 bg-secondary border-0 h-12"
              required
              maxLength={50}
            />
          </div>

          <Button
            type="submit"
            variant="spotify"
            size="lg"
            className="w-full"
            disabled={loading || !groupName.trim()}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Group'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
