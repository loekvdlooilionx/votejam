 import { useState, useCallback } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
 import { Plus, Search, Music, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
 import { SpotifySearchResult } from '@/types';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';

interface AddTrackDialogProps {
  onAddTrack: (track: SpotifySearchResult) => Promise<void>;
  disabled?: boolean;
}

export function AddTrackDialog({ onAddTrack, disabled }: AddTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotifySearchResult[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

   const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    
    setLoading(true);
     try {
       const { data, error } = await supabase.functions.invoke('search-tracks', {
         body: { query: search.trim() },
       });
 
       if (error) throw error;
       setResults(data.tracks || []);
     } catch (error) {
       console.error('Search error:', error);
       toast.error('Zoeken mislukt');
       setResults([]);
     } finally {
       setLoading(false);
     }
   }, [search]);

  const handleAdd = async (track: SpotifySearchResult) => {
    setAddingId(track.id);
    try {
      await onAddTrack(track);
      setOpen(false);
      setSearch('');
      setResults([]);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2" disabled={disabled}>
          <Plus className="w-4 h-4" />
           Track Toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Music className="w-6 h-6 text-spotify-green" />
             Track Toevoegen
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                 placeholder="Zoek een nummer of artiest..."
                className="pl-10 bg-secondary border-0 h-12"
              />
            </div>
             <Button variant="spotify" onClick={handleSearch} disabled={loading || !search.trim()}>
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Zoek'}
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 max-h-80 overflow-y-auto"
              >
                {results.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <img
                      src={track.album.images[0]?.url}
                      alt={track.album.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                    <Button
                      variant="spotify"
                      size="sm"
                      onClick={() => handleAdd(track)}
                      disabled={addingId === track.id}
                    >
                      {addingId === track.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                         'Toevoegen'
                      )}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
