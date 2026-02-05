import { motion } from 'framer-motion';
import { Play, ThumbsUp, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Track } from '@/types';

interface TrackCardProps {
  track: Track;
  rank: number;
  onVote: () => void;
  canVote: boolean;
  hasVoted?: boolean;
   onPlay?: () => void;
}

 export function TrackCard({ track, rank, onVote, canVote, hasVoted, onPlay }: TrackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className="track-card flex items-center gap-4"
    >
      {/* Rank */}
      <div className={`w-8 text-center font-bold text-lg ${
        rank <= 3 ? 'text-spotify-green' : 'text-muted-foreground'
      }`}>
        {rank}
      </div>

      {/* Album Art */}
       <div 
         className={`w-14 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0 relative group ${
           track.preview_url && onPlay ? 'cursor-pointer' : ''
         }`}
         onClick={() => track.preview_url && onPlay?.()}
       >
        {track.album_image_url ? (
          <img
            src={track.album_image_url}
            alt={track.album || track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {track.preview_url && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{track.title}</h4>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
      </div>

      {/* Vote Count */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary">
        <ThumbsUp className="w-4 h-4 text-spotify-green" />
        <span className="font-bold text-foreground">{track.vote_count || 0}</span>
      </div>

      {/* Vote Button */}
      <Button
        variant={hasVoted ? "secondary" : "coin"}
        size="sm"
        onClick={onVote}
        disabled={!canVote || hasVoted}
        className="flex-shrink-0"
      >
         {hasVoted ? 'Gestemd' : 'Stem'}
      </Button>
    </motion.div>
  );
}
