import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Music, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotifySearchResult } from '@/types';

interface AddTrackDialogProps {
  onAddTrack: (track: SpotifySearchResult) => Promise<void>;
  disabled?: boolean;
}

// Mock search results for demo (will be replaced with Spotify API)
const mockResults: SpotifySearchResult[] = [
  {
    id: '1',
    name: 'Blinding Lights',
    artists: [{ name: 'The Weeknd' }],
    album: { name: 'After Hours', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' }] },
    preview_url: null,
  },
  {
    id: '2',
    name: 'Levitating',
    artists: [{ name: 'Dua Lipa' }],
    album: { name: 'Future Nostalgia', images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop' }] },
    preview_url: null,
  },
  {
    id: '3',
    name: 'Stay',
    artists: [{ name: 'The Kid LAROI, Justin Bieber' }],
    album: { name: 'F*CK LOVE 3', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' }] },
    preview_url: null,
  },
  {
    id: '4',
    name: 'Heat Waves',
    artists: [{ name: 'Glass Animals' }],
    album: { name: 'Dreamland', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&h=100&fit=crop' }] },
    preview_url: null,
  },
];

export function AddTrackDialog({ onAddTrack, disabled }: AddTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotifySearchResult[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter mock results based on search
    const filtered = mockResults.filter(
      r => r.name.toLowerCase().includes(search.toLowerCase()) ||
           r.artists[0].name.toLowerCase().includes(search.toLowerCase())
    );
    setResults(filtered.length > 0 ? filtered : mockResults);
    setLoading(false);
  };

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
          Add Track
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Music className="w-6 h-6 text-spotify-green" />
            Add a Track
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
                placeholder="Search for a song or artist..."
                className="pl-10 bg-secondary border-0 h-12"
              />
            </div>
            <Button variant="spotify" onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Demo mode: Showing sample tracks. Connect Spotify API for real search.</p>
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
                        'Add'
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
