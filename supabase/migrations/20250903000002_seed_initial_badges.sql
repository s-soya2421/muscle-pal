-- Seed initial badges for MVP
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
    '習慣化',
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

-- Create exclusive challenges that require badges
-- Note: We'll need to update the challenges table structure first
-- This assumes challenges table exists and has the required columns

-- First, let's create some sample exclusive challenges
-- (In practice, these might be created through the app interface)

INSERT INTO challenges (
    title, 
    description, 
    category, 
    difficulty, 
    duration, 
    required_badge_id, 
    is_exclusive, 
    exclusive_message,
    reward
) VALUES 
(
    'プランク地獄30分',
    '30分間連続でプランクにチャレンジ。基礎をマスターした方のみ参加可能。',
    '体幹強化',
    '上級',
    1,
    (SELECT id FROM badges WHERE slug = 'plank_master'),
    true,
    'プランクマスターバッジが必要です。まずは基礎チャレンジから始めましょう。',
    'プランク地獄サバイバーバッジ'
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
    'ライフスタイルマスターバッジ'
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
    'ロングディスタンスウォーカーバッジ'
);

-- Create view for user expertise areas (derived from badges)
CREATE OR REPLACE VIEW user_expertise AS
SELECT 
    ub.user_id,
    array_agg(DISTINCT b.category) as expertise_areas,
    count(*) as total_badges,
    max(ub.earned_at) as latest_badge_earned
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
GROUP BY ub.user_id;

-- Create function to award badge to user
CREATE OR REPLACE FUNCTION award_badge_to_user(
    target_user_id UUID,
    badge_slug VARCHAR(100),
    challenge_id UUID DEFAULT NULL,
    user_note TEXT DEFAULT NULL,
    achievement_stats JSONB DEFAULT '{}'::jsonb
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
        RETURN false; -- User already has this badge
    END IF;
    
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id, challenge_id, personal_note, stats)
    VALUES (target_user_id, badge_id, challenge_id, user_note, achievement_stats);
    
    RETURN true;
END;
$$;

-- Create function to get challenges accessible to user (including exclusive ones)
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
    can_participate BOOLEAN
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
        CASE 
            WHEN c.required_badge_id IS NULL THEN true
            WHEN EXISTS(
                SELECT 1 FROM user_badges ub 
                WHERE ub.user_id = target_user_id 
                AND ub.badge_id = c.required_badge_id
            ) THEN true
            ELSE false
        END as can_participate
    FROM challenges c
    LEFT JOIN badges b ON b.id = c.required_badge_id
    WHERE c.is_active = true -- assuming challenges have is_active column
    ORDER BY c.is_exclusive ASC, c.created_at DESC;
END;
$$;