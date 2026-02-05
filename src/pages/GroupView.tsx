import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { CoinDisplay } from '@/components/voting/CoinDisplay';
import { TrackCard } from '@/components/voting/TrackCard';
import { AddTrackDialog } from '@/components/voting/AddTrackDialog';
 import { MusicPlayer } from '@/components/voting/MusicPlayer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Group, GroupWeek, Track, SpotifySearchResult } from '@/types';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Loader2, 
  Music, 
  Calendar,
  Users,
  Crown,
  ListMusic,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GroupView() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [activeWeek, setActiveWeek] = useState<GroupWeek | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
   const [playerOpen, setPlayerOpen] = useState(false);
   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const coinsLeft = 3 - coinsSpent;

  const fetchGroupData = async () => {
    if (!groupId || !user) return;

    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch user's role
      const { data: membership, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;
      setUserRole(membership.role as 'admin' | 'member');

      // Fetch member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      setMemberCount(count || 0);

      // Fetch active week
      const { data: weekData, error: weekError } = await supabase
        .from('group_weeks')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .single();

      if (weekError && weekError.code !== 'PGRST116') throw weekError;
      setActiveWeek(weekData);

      if (weekData) {
        // Fetch tracks with vote counts
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select(`
            *,
            votes (
              coins_spent,
              user_id
            )
          `)
          .eq('group_week_id', weekData.id)
          .order('added_at', { ascending: false });

        if (tracksError) throw tracksError;

        // Fetch all user profiles that voted
        const allVoterIds = new Set<string>();
        (tracksData || []).forEach(track => {
          (track.votes as any[])?.forEach((v: any) => {
            allVoterIds.add(v.user_id);
          });
        });

        let voterProfiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
        if (allVoterIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles_public')
            .select('user_id, display_name, avatar_url')
            .in('user_id', Array.from(allVoterIds));
          
          profiles?.forEach(p => {
            if (p.user_id) {
              voterProfiles[p.user_id] = {
                display_name: p.display_name,
                avatar_url: p.avatar_url,
              };
            }
          });
        }

        // Calculate vote counts
        const tracksWithVotes = (tracksData || []).map(track => ({
          ...track,
          vote_count: (track.votes as any[])?.reduce((sum: number, v: any) => sum + v.coins_spent, 0) || 0,
          voters: (track.votes as any[])?.map((v: any) => ({
            user_id: v.user_id,
            display_name: voterProfiles[v.user_id]?.display_name || null,
            avatar_url: voterProfiles[v.user_id]?.avatar_url || null,
            coins_spent: v.coins_spent,
          })) || [],
        }));

        // Filter to only tracks with votes, then sort by votes
        const votedTracks = tracksWithVotes.filter(t => t.vote_count > 0);
        votedTracks.sort((a, b) => b.vote_count - a.vote_count);
        setTracks(votedTracks);

        // Fetch user's coins spent
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('coins_spent')
          .eq('group_week_id', weekData.id)
          .eq('user_id', user.id);

        if (votesError) throw votesError;
        
        const spent = votesData?.reduce((sum, v) => sum + v.coins_spent, 0) || 0;
        setCoinsSpent(spent);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId, user]);

  const handleCopyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTrack = async (spotifyTrack: SpotifySearchResult) => {
    if (!activeWeek || !user) return;

    try {
      const { data: newTrack, error } = await supabase
        .from('tracks')
        .insert({
          spotify_id: spotifyTrack.id,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map(a => a.name).join(', '),
          album: spotifyTrack.album.name,
          album_image_url: spotifyTrack.album.images[0]?.url,
          preview_url: spotifyTrack.preview_url,
          group_week_id: activeWeek.id,
          added_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This track is already in the list!');
        } else {
          throw error;
        }
        return;
      }

      // Auto-vote for the track you just added (if you have coins left)
      if (newTrack && coinsLeft > 0) {
        await supabase
          .from('votes')
          .insert({
            track_id: newTrack.id,
            user_id: user.id,
            group_week_id: activeWeek.id,
            coins_spent: 1,
          });
      }

      toast.success('Track added!');
      fetchGroupData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVote = async (trackId: string) => {
    if (!activeWeek || !user || coinsLeft <= 0) return;

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          track_id: trackId,
          user_id: user.id,
          group_week_id: activeWeek.id,
          coins_spent: 1,
        });

      if (error) throw error;

      toast.success('Vote cast!');
      fetchGroupData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-spotify-green" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Group not found</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="gradient-spotify">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>

          {/* Group Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end gap-6"
          >
            {/* Group Icon */}
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-spotify-green to-spotify-green-bright flex items-center justify-center shadow-2xl">
              <ListMusic className="w-16 h-16 text-black" />
            </div>

            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Group
                </span>
                {userRole === 'admin' && (
                  <span className="flex items-center gap-1 text-xs text-coin-gold bg-coin-gold/10 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{group.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
                {activeWeek && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Week {activeWeek.week_number}
                  </span>
                )}
              </div>
            </div>

            {/* Invite Code */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Invite Code
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary transition-colors rounded-lg px-4 py-2"
              >
                <span className="invite-code">{group.invite_code}</span>
                {copied ? (
                  <Check className="w-5 h-5 text-spotify-green" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Voting Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">This Week's Tracks</h2>
            <CoinDisplay coinsLeft={coinsLeft} />
          </div>
          <AddTrackDialog onAddTrack={handleAddTrack} disabled={!activeWeek} />
        </motion.div>

        {/* Tracks List */}
        {!activeWeek ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No active voting week</h3>
            <p className="text-muted-foreground">
              {userRole === 'admin' 
                ? 'Create a new week to start voting!'
                : 'Waiting for admin to start a new week.'}
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nog geen nummers met stemmen</h3>
            <p className="text-muted-foreground mb-6">
              Voeg een nummer toe om automatisch je eerste stem te geven!
            </p>
          </div>
        ) : (
          <>
            {/* Play all button */}
            {tracks.some(t => t.preview_url) && (
              <div className="mb-6">
                <Button
                  variant="spotify"
                  size="lg"
                  onClick={() => {
                    const firstPlayableIndex = tracks.findIndex(t => t.preview_url);
                    if (firstPlayableIndex >= 0) {
                      setCurrentTrackIndex(firstPlayableIndex);
                      setPlayerOpen(true);
                    }
                  }}
                  className="gap-2"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Alles Afspelen
                </Button>
              </div>
            )}
            
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  rank={index + 1}
                  onVote={() => handleVote(track.id)}
                  canVote={coinsLeft > 0}
                   onPlay={() => {
                     setCurrentTrackIndex(index);
                     setPlayerOpen(true);
                   }}
                />
              ))}
            </div>
          </>
        )}
      </main>
       
       {/* Music Player */}
       {playerOpen && tracks.length > 0 && (
         <MusicPlayer
           tracks={tracks}
           currentTrackIndex={currentTrackIndex}
           onTrackChange={setCurrentTrackIndex}
           onClose={() => setPlayerOpen(false)}
         />
       )}
    </div>
  );
}
