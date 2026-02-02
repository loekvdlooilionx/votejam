import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { JoinGroupDialog } from '@/components/groups/JoinGroupDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Group, GroupMember } from '@/types';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupWithMembership extends Group {
  memberCount: number;
  userRole: 'admin' | 'member';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // Get groups user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups (
            id,
            name,
            invite_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      // Get member counts for each group
      const groupIds = memberships.map(m => m.group_id);
      const { data: counts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      // Count members per group
      const memberCounts: Record<string, number> = {};
      counts?.forEach(c => {
        memberCounts[c.group_id] = (memberCounts[c.group_id] || 0) + 1;
      });

      // Combine data
      const groupsData: GroupWithMembership[] = memberships
        .filter(m => m.groups)
        .map(m => ({
          ...(m.groups as unknown as Group),
          memberCount: memberCounts[m.group_id] || 1,
          userRole: m.role as 'admin' | 'member',
        }));

      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Groups</h1>
          <p className="text-muted-foreground">Vote for tracks and create playlists with your team</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <CreateGroupDialog onGroupCreated={fetchGroups} />
          <JoinGroupDialog onGroupJoined={fetchGroups} />
        </motion.div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-spotify-green" />
          </div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No groups yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a new group or join an existing one to start voting!
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                memberCount={group.memberCount}
                userRole={group.userRole}
                onClick={() => handleGroupClick(group.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
