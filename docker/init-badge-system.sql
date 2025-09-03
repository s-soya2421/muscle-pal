-- Badge System Tables for Docker Environment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('初級', '中級', '上級')),
    condition_type VARCHAR(50) NOT NULL,
    condition_value JSONB NOT NULL DEFAULT '{}',
    unlocks_features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS challenge_participations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    current_day INTEGER DEFAULT 0,
    completion_rate INTEGER DEFAULT 0,
    last_check_in TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(user_id, challenge_id)
);

-- Create daily_progress table
CREATE TABLE IF NOT EXISTS daily_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'paused')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    performance_data JSONB DEFAULT '{}',
    
    UNIQUE(user_id, challenge_id, day_number)
);

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    challenge_id UUID REFERENCES challenges(id),
    personal_note TEXT,
    stats JSONB DEFAULT '{}',
    
    UNIQUE(user_id, badge_id)
);

-- Add badge requirement to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS required_badge_id UUID REFERENCES badges(id);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS exclusive_message TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_badge_slug VARCHAR(100);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS required_completion_rate INTEGER DEFAULT 90;

-- Create indices
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_id ON challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge_id ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_challenge ON daily_progress(user_id, challenge_id);

-- Create functions
CREATE OR REPLACE FUNCTION get_user_badges(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    badge_id UUID,
    badge_name VARCHAR(100),
    badge_slug VARCHAR(100),
    badge_icon VARCHAR(10),
    badge_category VARCHAR(50),
    badge_difficulty VARCHAR(20),
    badge_description TEXT,
    earned_at TIMESTAMPTZ,
    personal_note TEXT,
    stats JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ub.id,
        b.id as badge_id,
        b.name as badge_name,
        b.slug as badge_slug,
        b.icon as badge_icon,
        b.category as badge_category,
        b.difficulty as badge_difficulty,
        b.description as badge_description,
        ub.earned_at,
        ub.personal_note,
        ub.stats
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = target_user_id
    ORDER BY ub.earned_at DESC;
END;
$$;

-- Function to award badge to user
CREATE OR REPLACE FUNCTION award_badge_to_user(
    target_user_id UUID,
    badge_slug VARCHAR(100),
    challenge_id UUID DEFAULT NULL,
    user_note TEXT DEFAULT NULL,
    achievement_stats JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    badge_id UUID;
    badge_exists BOOLEAN;
BEGIN
    -- Get badge ID
    SELECT id INTO badge_id FROM badges WHERE slug = badge_slug AND is_active = true;
    
    IF badge_id IS NULL THEN
        RAISE EXCEPTION 'Badge with slug % not found or inactive', badge_slug;
    END IF;
    
    -- Check if user already has this badge
    SELECT EXISTS(
        SELECT 1 FROM user_badges 
        WHERE user_id = target_user_id AND badge_id = badge_id
    ) INTO badge_exists;
    
    IF badge_exists THEN
        RETURN false;
    END IF;
    
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id, challenge_id, personal_note, stats)
    VALUES (target_user_id, badge_id, challenge_id, user_note, achievement_stats);
    
    RETURN true;
END;
$$;

-- Function to get accessible challenges
CREATE OR REPLACE FUNCTION get_accessible_challenges(target_user_id UUID)
RETURNS TABLE (
    challenge_id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(20),
    duration INTEGER,
    is_exclusive BOOLEAN,
    required_badge_name VARCHAR(100),
    required_badge_icon VARCHAR(10),
    can_participate BOOLEAN,
    exclusive_message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as challenge_id,
        c.title,
        c.description,
        c.category,
        c.difficulty,
        c.duration,
        c.is_exclusive,
        b.name as required_badge_name,
        b.icon as required_badge_icon,
        CASE 
            WHEN c.required_badge_id IS NULL THEN true
            WHEN EXISTS(
                SELECT 1 FROM user_badges ub 
                WHERE ub.user_id = target_user_id 
                AND ub.badge_id = c.required_badge_id
            ) THEN true
            ELSE false
        END as can_participate,
        c.exclusive_message
    FROM challenges c
    LEFT JOIN badges b ON b.id = c.required_badge_id
    ORDER BY c.is_exclusive ASC, c.created_at DESC;
END;
$$;

-- Function to check if user can join exclusive challenge
CREATE OR REPLACE FUNCTION can_join_exclusive_challenge(target_user_id UUID, challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    required_badge UUID;
    has_badge BOOLEAN;
BEGIN
    SELECT required_badge_id INTO required_badge
    FROM challenges 
    WHERE id = challenge_id AND is_exclusive = true;
    
    IF required_badge IS NULL THEN
        RETURN true;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM user_badges 
        WHERE user_id = target_user_id AND badge_id = required_badge
    ) INTO has_badge;
    
    RETURN has_badge;
END;
$$;

-- Insert initial badges
INSERT INTO badges (name, slug, description, icon, category, difficulty, condition_type, condition_value, unlocks_features) VALUES
(
    'プランクマスター',
    'plank_master',
    '30日間プランクチャレンジを完了した体幹強化のエキスパート',
    '🏆',
    '体幹強化',
    '中級',
    'challenge_completion',
    '{"challenge_slug": "30-day-plank", "required_completion_rate": 90}',
    '["exclusive_challenges", "expertise_display", "mentor_status"]'
),
(
    '継続王',
    'consistency_king',
    '週5日運動習慣チャレンジを完了した継続の達人',
    '👑',
    '習慣化',
    '中級',
    'challenge_completion',
    '{"challenge_slug": "weekly-5-exercise", "required_completion_rate": 85}',
    '["exclusive_challenges", "expertise_display", "habit_tools"]'
),
(
    'ウォーキング王',
    'walker_champion',
    '10000歩ウォーキングチャレンジを完了した有酸素運動のエキスパート',
    '🚶',
    '有酸素運動',
    '初級',
    'challenge_completion',
    '{"challenge_slug": "10000-steps", "required_completion_rate": 90}',
    '["exclusive_challenges", "expertise_display", "route_sharing"]'
),
(
    '早起きマスター',
    'early_bird_master',
    '朝活チャレンジを完了した時間管理のプロ',
    '🌅',
    '時間管理',
    '上級',
    'challenge_completion',
    '{"challenge_slug": "morning-routine", "required_completion_rate": 95}',
    '["exclusive_challenges", "expertise_display", "morning_tools"]'
),
(
    '筋トレエキスパート',
    'strength_expert',
    '筋力トレーニングチャレンジを完了した筋トレのプロ',
    '💪',
    '筋力トレーニング',
    '上級',
    'challenge_completion',
    '{"challenge_slug": "strength-training", "required_completion_rate": 85}',
    '["exclusive_challenges", "expertise_display", "workout_plans"]'
);

-- Update existing challenges with badge rewards (based on title since IDs are generated dynamically)
UPDATE challenges SET reward_badge_slug = 'plank_master' WHERE title = '30日プランクチャレンジ';
UPDATE challenges SET reward_badge_slug = 'consistency_king' WHERE title = '週5日運動習慣';  
UPDATE challenges SET reward_badge_slug = 'walker_champion' WHERE title = '10000歩ウォーキング';

-- Insert exclusive challenges
INSERT INTO challenges (title, description, category, difficulty, duration, required_badge_id, is_exclusive, exclusive_message, reward, reward_badge_slug) VALUES 
(
    'プランク地獄30分',
    '30分間連続でプランクにチャレンジ。基礎をマスターした方のみ参加可能。',
    '体幹強化',
    '上級',
    1,
    (SELECT id FROM badges WHERE slug = 'plank_master'),
    true,
    'プランクマスターバッジが必要です。まずは基礎チャレンジから始めましょう。',
    'プランク地獄サバイバーバッジ',
    'plank_hell_survivor'
),
(
    '習慣化エキスパート道場',
    '複数の習慣を同時に身につける上級者向けチャレンジ',
    '習慣化',
    '上級',
    30,
    (SELECT id FROM badges WHERE slug = 'consistency_king'),
    true,
    '継続王バッジが必要です。習慣化の基礎を身につけてからご参加ください。',
    'ライフスタイルマスターバッジ',
    'lifestyle_master'
),
(
    '月間300kmウォーキング',
    '1ヶ月で300km歩く長距離チャレンジ',
    '有酸素運動',
    '上級',
    30,
    (SELECT id FROM badges WHERE slug = 'walker_champion'),
    true,
    'ウォーキング王バッジが必要です。基礎体力をつけてからチャレンジしましょう。',
    'ロングディスタンスウォーカーバッジ',
    'long_distance_walker'
);

-- Insert test user badges (using dynamic user lookup)
DO $$
DECLARE
    demo_user1_id UUID;
    demo_user2_id UUID;
BEGIN
    -- Get the first two user IDs from auth.users (created by init-db.sql)
    SELECT id INTO demo_user1_id FROM auth.users WHERE email = 'demo1@musclepal.com' LIMIT 1;
    SELECT id INTO demo_user2_id FROM auth.users WHERE email = 'demo2@musclepal.com' LIMIT 1;
    
    -- Only proceed if users exist
    IF demo_user1_id IS NOT NULL THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at, personal_note, stats) VALUES 
        (
            demo_user1_id,
            (SELECT id FROM badges WHERE slug = 'plank_master'),
            NOW() - INTERVAL '5 days',
            '風邪で2日休んだけど、最後まで諦めなかった！毎朝5時に頑張りました。',
            '{"challengeDuration": 30, "improvementData": {"before": "30秒", "after": "3分", "improvementPercentage": 600}, "streakData": {"longestStreak": 12, "finalStreak": 8}, "completionRate": 93}'::jsonb
        ),
        (
            demo_user1_id, 
            (SELECT id FROM badges WHERE slug = 'walker_champion'),
            NOW() - INTERVAL '2 days',
            '家族と一緒に歩けて楽しかった！雨の日も室内で足踏みして継続。',
            '{"challengeDuration": 21, "improvementData": {"before": "平均7000歩", "after": "平均12000歩", "improvementPercentage": 71}, "streakData": {"longestStreak": 15, "finalStreak": 15}, "completionRate": 95}'::jsonb
        );
    END IF;
END
$$;

-- Insert test challenge participations (using dynamic lookups)
DO $$
DECLARE
    demo_user1_id UUID;
    demo_user2_id UUID;
    plank_challenge_id UUID;
    habit_challenge_id UUID;
    walk_challenge_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO demo_user1_id FROM auth.users WHERE email = 'demo1@musclepal.com' LIMIT 1;
    SELECT id INTO demo_user2_id FROM auth.users WHERE email = 'demo2@musclepal.com' LIMIT 1;
    
    -- Get challenge IDs
    SELECT id INTO plank_challenge_id FROM challenges WHERE title = '30日プランクチャレンジ' LIMIT 1;
    SELECT id INTO habit_challenge_id FROM challenges WHERE title = '週5日運動習慣' LIMIT 1;
    SELECT id INTO walk_challenge_id FROM challenges WHERE title = '10000歩ウォーキング' LIMIT 1;
    
    -- Insert participations if all IDs exist
    IF demo_user1_id IS NOT NULL AND demo_user2_id IS NOT NULL AND 
       plank_challenge_id IS NOT NULL AND habit_challenge_id IS NOT NULL AND walk_challenge_id IS NOT NULL THEN
        INSERT INTO challenge_participations (user_id, challenge_id, started_at, status, current_day, completion_rate, last_check_in) VALUES
        (
            demo_user1_id,
            plank_challenge_id,
            NOW() - INTERVAL '30 days',
            'completed',
            30,
            93,
            NOW() - INTERVAL '5 days'
        ),
        (
            demo_user2_id,
            habit_challenge_id,
            NOW() - INTERVAL '7 days',
            'active',
            5,
            71,
            NOW() - INTERVAL '1 day'
        ),
        (
            demo_user1_id,
            walk_challenge_id,
            NOW() - INTERVAL '21 days',
            'completed',
            21,
            95,
            NOW() - INTERVAL '2 days'
        );
    END IF;
END
$$;

-- Insert sample daily progress (using dynamic lookups)
DO $$
DECLARE
    demo_user1_id UUID;
    demo_user2_id UUID;
    plank_challenge_id UUID;
    habit_challenge_id UUID;
    walk_challenge_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO demo_user1_id FROM auth.users WHERE email = 'demo1@musclepal.com' LIMIT 1;
    SELECT id INTO demo_user2_id FROM auth.users WHERE email = 'demo2@musclepal.com' LIMIT 1;
    
    -- Get challenge IDs
    SELECT id INTO plank_challenge_id FROM challenges WHERE title = '30日プランクチャレンジ' LIMIT 1;
    SELECT id INTO habit_challenge_id FROM challenges WHERE title = '週5日運動習慣' LIMIT 1;
    SELECT id INTO walk_challenge_id FROM challenges WHERE title = '10000歩ウォーキング' LIMIT 1;
    
    -- Insert daily progress if all IDs exist
    IF demo_user1_id IS NOT NULL AND demo_user2_id IS NOT NULL AND 
       plank_challenge_id IS NOT NULL AND habit_challenge_id IS NOT NULL AND walk_challenge_id IS NOT NULL THEN
        INSERT INTO daily_progress (user_id, challenge_id, day_number, target_date, status, completed_at, notes, performance_data) VALUES
        -- Demo user 1's completed plank challenge
        (demo_user1_id, plank_challenge_id, 1, (NOW() - INTERVAL '30 days')::date, 'completed', NOW() - INTERVAL '30 days', '初日！頑張るぞ', '{"duration": "30秒"}'::jsonb),
        (demo_user1_id, plank_challenge_id, 2, (NOW() - INTERVAL '29 days')::date, 'completed', NOW() - INTERVAL '29 days', '少し慣れた', '{"duration": "35秒"}'::jsonb),
        (demo_user1_id, plank_challenge_id, 3, (NOW() - INTERVAL '28 days')::date, 'missed', NULL, NULL, NULL),
        (demo_user1_id, plank_challenge_id, 4, (NOW() - INTERVAL '27 days')::date, 'completed', NOW() - INTERVAL '27 days', '体調回復！', '{"duration": "40秒"}'::jsonb),
        (demo_user1_id, plank_challenge_id, 15, (NOW() - INTERVAL '16 days')::date, 'completed', NOW() - INTERVAL '16 days', '中間地点！', '{"duration": "90秒"}'::jsonb),
        (demo_user1_id, plank_challenge_id, 28, (NOW() - INTERVAL '3 days')::date, 'completed', NOW() - INTERVAL '3 days', 'もうすぐゴール', '{"duration": "2分40秒"}'::jsonb),
        (demo_user1_id, plank_challenge_id, 30, (NOW() - INTERVAL '1 day')::date, 'completed', NOW() - INTERVAL '1 day', 'ついに完了！', '{"duration": "3分"}'::jsonb),

        -- Demo user 2's active challenge  
        (demo_user2_id, habit_challenge_id, 1, (NOW() - INTERVAL '7 days')::date, 'completed', NOW() - INTERVAL '7 days', 'スタート！', '{"exercise_type": "ランニング", "duration": "30分"}'::jsonb),
        (demo_user2_id, habit_challenge_id, 2, (NOW() - INTERVAL '6 days')::date, 'completed', NOW() - INTERVAL '6 days', '2日目も完了', '{"exercise_type": "筋トレ", "duration": "40分"}'::jsonb),
        (demo_user2_id, habit_challenge_id, 3, (NOW() - INTERVAL '5 days')::date, 'missed', NULL, NULL, NULL),
        (demo_user2_id, habit_challenge_id, 4, (NOW() - INTERVAL '4 days')::date, 'completed', NOW() - INTERVAL '4 days', '復活！', '{"exercise_type": "ヨガ", "duration": "35分"}'::jsonb),
        (demo_user2_id, habit_challenge_id, 5, (NOW() - INTERVAL '3 days')::date, 'completed', NOW() - INTERVAL '3 days', 'だんだん習慣に', '{"exercise_type": "ヨガ", "duration": "45分"}'::jsonb),

        -- Demo user 1's completed walking challenge
        (demo_user1_id, walk_challenge_id, 1, (NOW() - INTERVAL '21 days')::date, 'completed', NOW() - INTERVAL '21 days', '10000歩チャレンジ開始', '{"steps": 12500}'::jsonb),
        (demo_user1_id, walk_challenge_id, 10, (NOW() - INTERVAL '12 days')::date, 'completed', NOW() - INTERVAL '12 days', '中盤戦', '{"steps": 11800}'::jsonb),
        (demo_user1_id, walk_challenge_id, 21, (NOW() - INTERVAL '1 day')::date, 'completed', NOW() - INTERVAL '1 day', '完走！', '{"steps": 13200}'::jsonb);
    END IF;
END
$$;