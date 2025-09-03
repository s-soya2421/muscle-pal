-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL, -- emoji icon
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('初級', '中級', '上級')),
    condition_type VARCHAR(50) NOT NULL, -- 'challenge_completion', 'streak', 'total_days', etc
    condition_value JSONB NOT NULL, -- flexible condition data
    unlocks_features JSONB DEFAULT '[]'::jsonb, -- array of features this badge unlocks
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_badges junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    challenge_id UUID, -- which challenge led to this badge (if applicable)
    personal_note TEXT, -- user's personal note about earning this badge
    stats JSONB DEFAULT '{}'::jsonb, -- achievement stats (before/after, duration, etc)
    
    UNIQUE(user_id, badge_id) -- prevent duplicate badges
);

-- Add indices for better performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at);

-- Add badge requirement to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS required_badge_id UUID REFERENCES badges(id);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS exclusive_message TEXT;

-- Create function to get user's badges with details
CREATE OR REPLACE FUNCTION get_user_badges(target_user_id UUID)
RETURNS TABLE (
    badge_id UUID,
    badge_name VARCHAR(100),
    badge_slug VARCHAR(100),
    badge_icon VARCHAR(10),
    badge_category VARCHAR(50),
    earned_at TIMESTAMPTZ,
    personal_note TEXT,
    stats JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as badge_id,
        b.name as badge_name,
        b.slug as badge_slug,
        b.icon as badge_icon,
        b.category as badge_category,
        ub.earned_at,
        ub.personal_note,
        ub.stats
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = target_user_id
    ORDER BY ub.earned_at DESC;
END;
$$;

-- Create function to check if user can join exclusive challenge
CREATE OR REPLACE FUNCTION can_join_exclusive_challenge(target_user_id UUID, challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    required_badge UUID;
    has_badge BOOLEAN;
BEGIN
    -- Get required badge for this challenge
    SELECT required_badge_id INTO required_badge
    FROM challenges 
    WHERE id = challenge_id AND is_exclusive = true;
    
    -- If no badge required, user can join
    IF required_badge IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if user has the required badge
    SELECT EXISTS(
        SELECT 1 FROM user_badges 
        WHERE user_id = target_user_id AND badge_id = required_badge
    ) INTO has_badge;
    
    RETURN has_badge;
END;
$$;

-- Add RLS policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can read badges
CREATE POLICY "Badges are viewable by everyone" ON badges
    FOR SELECT USING (true);

-- Users can read all user_badges (for leaderboards, etc)
CREATE POLICY "User badges are viewable by everyone" ON user_badges
    FOR SELECT USING (true);

-- Users can only insert their own badges (this should be done via functions in practice)
CREATE POLICY "Users can insert their own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own badge notes
CREATE POLICY "Users can update their own badge notes" ON user_badges
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badges_updated_at 
    BEFORE UPDATE ON badges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();