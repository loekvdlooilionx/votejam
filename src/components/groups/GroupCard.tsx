import { motion } from 'framer-motion';
import { Users, ChevronRight, Crown } from 'lucide-react';
import { Group, GroupMember } from '@/types';

interface GroupCardProps {
  group: Group;
  memberCount: number;
  userRole: 'admin' | 'member';
  onClick: () => void;
  index: number;
}

export function GroupCard({ group, memberCount, userRole, onClick, index }: GroupCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={onClick}
      className="track-card cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        {/* Group Avatar */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-spotify-green to-spotify-green-bright flex items-center justify-center flex-shrink-0">
          <Users className="w-7 h-7 text-black" />
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground truncate">{group.name}</h3>
            {userRole === 'admin' && (
              <Crown className="w-4 h-4 text-coin-gold flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Active indicator */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-spotify-green rounded-full m-3 pulse-active" />
    </motion.div>
  );
}
