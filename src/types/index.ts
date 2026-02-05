export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface GroupWeek {
  id: string;
  group_id: string;
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  is_active: boolean;
  created_at: string;
}

export interface Track {
  id: string;
  spotify_id: string;
  title: string;
  artist: string;
  album: string | null;
  album_image_url: string | null;
  preview_url: string | null;
  group_week_id: string;
  added_by: string | null;
  added_at: string;
  vote_count?: number;
  voters?: Array<{
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    coins_spent: number;
  }>;
}

export interface Vote {
  id: string;
  track_id: string;
  user_id: string;
  group_week_id: string;
  coins_spent: number;
  voted_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SpotifySearchResult {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  preview_url: string | null;
}
