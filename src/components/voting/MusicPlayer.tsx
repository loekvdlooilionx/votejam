  import { useState, useRef, useEffect, useCallback } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
  import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Music2, Shuffle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Slider } from '@/components/ui/slider';
 import { Track } from '@/types';
 
 interface MusicPlayerProps {
   tracks: Track[];
   currentTrackIndex: number;
   onTrackChange: (index: number) => void;
   onClose: () => void;
 }
 
 export function MusicPlayer({ tracks, currentTrackIndex, onTrackChange, onClose }: MusicPlayerProps) {
   const [isPlaying, setIsPlaying] = useState(false);
   const [progress, setProgress] = useState(0);
   const [volume, setVolume] = useState(0.7);
   const [isMuted, setIsMuted] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
   const audioRef = useRef<HTMLAudioElement>(null);
 
   const currentTrack = tracks[currentTrackIndex];
 
   useEffect(() => {
     if (audioRef.current) {
       audioRef.current.volume = isMuted ? 0 : volume;
     }
   }, [volume, isMuted]);

    // Initialize shuffled order when shuffle is toggled or tracks change
    useEffect(() => {
      if (isShuffled) {
        const indices = tracks.map((_, i) => i).filter(i => i !== currentTrackIndex);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        // Put current track at the start
        setShuffledOrder([currentTrackIndex, ...indices]);
      }
    }, [isShuffled, tracks.length]);
 
   useEffect(() => {
     if (audioRef.current && currentTrack?.preview_url) {
       audioRef.current.src = currentTrack.preview_url;
       if (isPlaying) {
         audioRef.current.play().catch(console.error);
       }
     }
   }, [currentTrackIndex, currentTrack]);
 
   const togglePlay = async () => {
     if (!audioRef.current || !currentTrack?.preview_url) return;
 
     if (isPlaying) {
       audioRef.current.pause();
     } else {
       await audioRef.current.play();
     }
     setIsPlaying(!isPlaying);
   };
 
   const handleTimeUpdate = () => {
     if (audioRef.current) {
       const progressPercent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
       setProgress(progressPercent || 0);
     }
   };
 
   const handleEnded = () => {
     // Auto-play next track
      if (isShuffled) {
        const currentShuffleIndex = shuffledOrder.indexOf(currentTrackIndex);
        if (currentShuffleIndex < shuffledOrder.length - 1) {
          onTrackChange(shuffledOrder[currentShuffleIndex + 1]);
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
     } else {
        if (currentTrackIndex < tracks.length - 1) {
          onTrackChange(currentTrackIndex + 1);
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
     }
   };
 
   const handlePrevious = () => {
      if (isShuffled) {
        const currentShuffleIndex = shuffledOrder.indexOf(currentTrackIndex);
        if (currentShuffleIndex > 0) {
          onTrackChange(shuffledOrder[currentShuffleIndex - 1]);
        }
      } else {
        if (currentTrackIndex > 0) {
          onTrackChange(currentTrackIndex - 1);
        }
     }
   };
 
   const handleNext = () => {
      if (isShuffled) {
        const currentShuffleIndex = shuffledOrder.indexOf(currentTrackIndex);
        if (currentShuffleIndex < shuffledOrder.length - 1) {
          onTrackChange(shuffledOrder[currentShuffleIndex + 1]);
        }
      } else {
        if (currentTrackIndex < tracks.length - 1) {
          onTrackChange(currentTrackIndex + 1);
        }
     }
   };
 
   const handleSeek = (value: number[]) => {
     if (audioRef.current && audioRef.current.duration) {
       audioRef.current.currentTime = (value[0] / 100) * audioRef.current.duration;
       setProgress(value[0]);
     }
   };
 
   if (!currentTrack) return null;
 
   return (
     <AnimatePresence>
       <motion.div
         initial={{ y: 100, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         exit={{ y: 100, opacity: 0 }}
         className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50"
       >
         <audio
           ref={audioRef}
           onTimeUpdate={handleTimeUpdate}
           onEnded={handleEnded}
           onPlay={() => setIsPlaying(true)}
           onPause={() => setIsPlaying(false)}
         />
 
         {/* Progress bar */}
         <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
           <Slider
             value={[progress]}
             onValueChange={handleSeek}
             max={100}
             step={0.1}
             className="absolute -top-1.5 left-0 right-0"
           />
         </div>
 
         <div className="container mx-auto px-4 py-3">
           <div className="flex items-center gap-4">
             {/* Track Info */}
             <div className="flex items-center gap-3 flex-1 min-w-0">
               {currentTrack.album_image_url ? (
                 <img
                   src={currentTrack.album_image_url}
                   alt={currentTrack.album || currentTrack.title}
                   className="w-14 h-14 rounded-md object-cover shadow-lg"
                 />
               ) : (
                 <div className="w-14 h-14 rounded-md bg-secondary flex items-center justify-center">
                   <Music2 className="w-6 h-6 text-muted-foreground" />
                 </div>
               )}
               <div className="min-w-0">
                 <p className="font-semibold text-foreground truncate">{currentTrack.title}</p>
                 <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
               </div>
             </div>
 
             {/* Controls */}
             <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={isShuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  <Shuffle className="w-5 h-5" />
                </Button>

               <Button
                 variant="ghost"
                 size="icon"
                 onClick={handlePrevious}
                  disabled={isShuffled ? shuffledOrder.indexOf(currentTrackIndex) === 0 : currentTrackIndex === 0}
                 className="text-muted-foreground hover:text-foreground"
               >
                 <SkipBack className="w-5 h-5" />
               </Button>
 
               <Button
                 variant="spotify"
                 size="icon"
                 onClick={togglePlay}
                 disabled={!currentTrack.preview_url}
                 className="w-12 h-12 rounded-full"
               >
                 {isPlaying ? (
                   <Pause className="w-5 h-5" />
                 ) : (
                   <Play className="w-5 h-5 ml-0.5" />
                 )}
               </Button>
 
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={handleNext}
                  disabled={isShuffled ? shuffledOrder.indexOf(currentTrackIndex) === shuffledOrder.length - 1 : currentTrackIndex === tracks.length - 1}
                 className="text-muted-foreground hover:text-foreground"
               >
                 <SkipForward className="w-5 h-5" />
               </Button>
             </div>
 
             {/* Volume & Close */}
             <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setIsMuted(!isMuted)}
                 className="text-muted-foreground hover:text-foreground"
               >
                 {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
               </Button>
               <Slider
                 value={[isMuted ? 0 : volume * 100]}
                 onValueChange={(v) => {
                   setVolume(v[0] / 100);
                   setIsMuted(false);
                 }}
                 max={100}
                 step={1}
                 className="w-24"
               />
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={onClose}
                 className="ml-2 text-muted-foreground hover:text-foreground"
               >
                 <X className="w-5 h-5" />
               </Button>
             </div>
 
             {/* Mobile close button */}
             <Button
               variant="ghost"
               size="icon"
               onClick={onClose}
               className="md:hidden text-muted-foreground hover:text-foreground"
             >
               <X className="w-5 h-5" />
             </Button>
           </div>
         </div>
       </motion.div>
     </AnimatePresence>
   );
 }