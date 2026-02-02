-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_members table with roles
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create group_weeks table for weekly voting rounds
CREATE TABLE public.group_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    week_number INT NOT NULL,
    year INT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, week_number, year)
);

-- Create tracks table for Spotify tracks added to voting
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spotify_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    album_image_url TEXT,
    preview_url TEXT,
    group_week_id UUID REFERENCES public.group_weeks(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(spotify_id, group_week_id)
);

-- Create votes table
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    group_week_id UUID REFERENCES public.group_weeks(id) ON DELETE CASCADE NOT NULL,
    coins_spent INT NOT NULL DEFAULT 1 CHECK (coins_spent > 0),
    voted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = _group_id AND user_id = auth.uid()
    )
$$;

-- Helper function: Check if user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = _group_id AND user_id = auth.uid() AND role = 'admin'
    )
$$;

-- Helper function: Get coins spent by user in a group week
CREATE OR REPLACE FUNCTION public.get_coins_spent(_user_id UUID, _group_week_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(coins_spent), 0)::INT
    FROM public.votes
    WHERE user_id = _user_id AND group_week_id = _group_week_id
$$;

-- Helper function: Check if user can vote (has coins left)
CREATE OR REPLACE FUNCTION public.can_vote(_group_week_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_coins_spent(auth.uid(), _group_week_id) < 3
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid());

-- Allow viewing profiles of group members
CREATE POLICY "Users can view profiles of fellow group members"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm1
            JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
        )
    );

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
    ON public.groups FOR SELECT
    USING (public.is_group_member(id));

CREATE POLICY "Authenticated users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their groups"
    ON public.groups FOR UPDATE
    USING (public.is_group_admin(id));

CREATE POLICY "Admins can delete their groups"
    ON public.groups FOR DELETE
    USING (public.is_group_admin(id));

-- Group members policies
CREATE POLICY "Members can view other members in their groups"
    ON public.group_members FOR SELECT
    USING (public.is_group_member(group_id));

CREATE POLICY "Users can join groups"
    ON public.group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can leave groups, admins can remove members"
    ON public.group_members FOR DELETE
    USING (user_id = auth.uid() OR public.is_group_admin(group_id));

-- Group weeks policies
CREATE POLICY "Members can view group weeks"
    ON public.group_weeks FOR SELECT
    USING (public.is_group_member(group_id));

CREATE POLICY "Admins can create group weeks"
    ON public.group_weeks FOR INSERT
    WITH CHECK (public.is_group_admin(group_id));

CREATE POLICY "Admins can update group weeks"
    ON public.group_weeks FOR UPDATE
    USING (public.is_group_admin(group_id));

-- Tracks policies
CREATE POLICY "Members can view tracks in their groups"
    ON public.tracks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_weeks gw
            WHERE gw.id = tracks.group_week_id AND public.is_group_member(gw.group_id)
        )
    );

CREATE POLICY "Members can add tracks to active weeks"
    ON public.tracks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_weeks gw
            WHERE gw.id = tracks.group_week_id 
            AND public.is_group_member(gw.group_id)
            AND gw.is_active = true
        )
        AND added_by = auth.uid()
    );

-- Votes policies
CREATE POLICY "Members can view votes in their groups"
    ON public.votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_weeks gw
            WHERE gw.id = votes.group_week_id AND public.is_group_member(gw.group_id)
        )
    );

CREATE POLICY "Members can vote on active weeks with coins"
    ON public.votes FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.group_weeks gw
            WHERE gw.id = votes.group_week_id 
            AND public.is_group_member(gw.group_id)
            AND gw.is_active = true
        )
        AND public.can_vote(group_week_id)
    );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create group with admin membership
CREATE OR REPLACE FUNCTION public.create_group_with_admin(group_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_group_id UUID;
    new_invite_code TEXT;
BEGIN
    -- Generate unique invite code
    new_invite_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Create the group
    INSERT INTO public.groups (name, invite_code, created_by)
    VALUES (group_name, new_invite_code, auth.uid())
    RETURNING id INTO new_group_id;
    
    -- Add creator as admin
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, auth.uid(), 'admin');
    
    -- Create initial week for the group
    INSERT INTO public.group_weeks (group_id, week_number, year, week_start, week_end)
    VALUES (
        new_group_id,
        EXTRACT(WEEK FROM CURRENT_DATE)::INT,
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        date_trunc('week', CURRENT_DATE)::DATE,
        (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE
    );
    
    RETURN new_group_id;
END;
$$;

-- Function to join group via invite code
CREATE OR REPLACE FUNCTION public.join_group_via_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_group_id UUID;
BEGIN
    -- Find group by invite code
    SELECT id INTO target_group_id
    FROM public.groups
    WHERE invite_code = upper(code);
    
    IF target_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Check if already a member
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = target_group_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Already a member of this group';
    END IF;
    
    -- Add as member
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (target_group_id, auth.uid(), 'member');
    
    RETURN target_group_id;
END;
$$;