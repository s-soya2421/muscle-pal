-- MusclePal Seed Data
-- 開発用のテストデータを投入

BEGIN;

-- 開発用テストユーザー（Supabase Auth）
DO $$
DECLARE
  dev_user_id uuid;
BEGIN
  SELECT id INTO dev_user_id FROM auth.users WHERE email = 'dev@example.com';

  IF NOT FOUND THEN
    dev_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      dev_user_id,
      'authenticated',
      'authenticated',
      'dev@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('role', 'admin', 'full_name', 'Dev User'),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('password123', gen_salt('bf')),
      email_confirmed_at = now(),
      last_sign_in_at = now(),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      raw_user_meta_data = jsonb_build_object('role', 'admin', 'full_name', 'Dev User'),
      updated_at = now()
    WHERE id = dev_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = dev_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      user_id,
      provider,
      provider_id,
      identity_data,
      email,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      dev_user_id,
      'email',
      'dev@example.com',
      jsonb_build_object('sub', dev_user_id::text, 'email', 'dev@example.com'),
      'dev@example.com',
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET
      identity_data = jsonb_build_object('sub', dev_user_id::text, 'email', 'dev@example.com'),
      email = 'dev@example.com',
      last_sign_in_at = now(),
      updated_at = now()
    WHERE user_id = dev_user_id AND provider = 'email';
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    bio,
    role,
    fitness_level,
    timezone
  )
  VALUES (
    dev_user_id,
    'devuser',
    '開発用ユーザー',
    '開発環境での画面確認用アカウントです。',
    'admin',
    'intermediate',
    'Asia/Tokyo'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    role = EXCLUDED.role,
    fitness_level = EXCLUDED.fitness_level,
    timezone = EXCLUDED.timezone,
    updated_at = now();
END;
$$;

-- テストユーザーのプロフィール作成（認証ユーザーが存在すると仮定）
-- 実際の開発では、auth.users テーブルにユーザーが作成された後に実行

-- サンプルチャレンジデータ
INSERT INTO public.challenges (id, title, description, category, difficulty, duration, participants, current_day, progress, reward) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'プランク30日チャレンジ', '毎日プランクを行い、体幹を強化しましょう！初日は30秒から始めて、徐々に時間を延ばします。', 'コア', '初級', 30, 245, 15, 50, '体幹力アップバッジ'),
  ('550e8400-e29b-41d4-a716-446655440002', '週5日運動習慣', '週5日、最低30分の運動を継続するチャレンジです。', 'フィットネス', '中級', 28, 189, 12, 43, 'フィットネスマスターバッジ'),
  ('550e8400-e29b-41d4-a716-446655440003', '10000歩ウォーキング', '毎日10000歩を目指して歩くチャレンジ。健康的なライフスタイルの第一歩！', 'カーディオ', '初級', 21, 412, 8, 38, 'ウォーキングチャンピオン'),
  ('550e8400-e29b-41d4-a716-446655440004', '筋トレ週3回ルーティン', '週3回の筋力トレーニングで全身の筋肉を鍛えるチャレンジ', '筋トレ', '中級', 56, 156, 25, 45, 'マッスルビルダーバッジ'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ヨガ21日間', '21日間毎日ヨガを行い、柔軟性と心の安定を手に入れるチャレンジ', 'ヨガ', '初級', 21, 298, 10, 48, '心身調和バッジ');

COMMIT;
