import { motion } from 'framer-motion';
import { Play, ThumbsUp, Music, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Track } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      className="track-card flex items-center gap-4 flex-wrap md:flex-nowrap"
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
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground truncate">{track.title}</h4>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.title + ' ' + track.artist)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-destructive hover:text-destructive/80 transition-colors flex-shrink-0"
            title="Zoek op YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
      </div>

      {/* Vote Count */}
      <div className="flex items-center gap-3">
        {/* Voters avatars */}
        {track.voters && track.voters.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center -space-x-2">
                  {track.voters.slice(0, 4).map((voter, idx) => (
                    <Avatar key={voter.user_id + idx} className="w-7 h-7 border-2 border-background">
                      <AvatarImage src={voter.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-xs">
                        {voter.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {track.voters.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{track.voters.length - 4}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Stemmen:
                  </p>
                  {track.voters.map((voter, idx) => (
                    <p key={voter.user_id + idx} className="text-muted-foreground">
                      {voter.display_name || 'Anoniem'} ({voter.coins_spent} coin{voter.coins_spent > 1 ? 's' : ''})
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary">
          <ThumbsUp className="w-4 h-4 text-spotify-green" />
          <span className="font-bold text-foreground">{track.vote_count || 0}</span>
        </div>
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
