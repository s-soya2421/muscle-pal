-- Database initialization script for MusclePal
-- This script sets up the basic Supabase schema and users

-- Create the necessary database users with passwords
DO $$
BEGIN
    -- Create anon user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE USER anon NOINHERIT;
    END IF;
    
    -- Create authenticated user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE USER authenticated NOINHERIT;
    END IF;
    
    -- Create service_role user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE USER service_role NOINHERIT BYPASSRLS;
    END IF;
    
    -- Create supabase_auth_admin user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'dev-postgres-password';
    ELSE
        ALTER USER supabase_auth_admin PASSWORD 'dev-postgres-password';
    END IF;
    
    -- Create supabase_storage_admin user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE USER supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'dev-postgres-password';
    ELSE
        ALTER USER supabase_storage_admin PASSWORD 'dev-postgres-password';
    END IF;
    
    -- Grant database-level permissions to storage admin
    GRANT CONNECT ON DATABASE postgres TO supabase_storage_admin;
    GRANT CREATE ON DATABASE postgres TO supabase_storage_admin;
    
    -- Create supabase_realtime_admin user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        CREATE USER supabase_realtime_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'dev-postgres-password';
    ELSE
        ALTER USER supabase_realtime_admin PASSWORD 'dev-postgres-password';
    END IF;
    
    -- Create authenticator user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE USER authenticator NOINHERIT LOGIN PASSWORD 'dev-postgres-password';
    ELSE
        ALTER USER authenticator PASSWORD 'dev-postgres-password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_storage_admin, supabase_auth_admin, supabase_realtime_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, supabase_storage_admin, supabase_auth_admin, supabase_realtime_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, supabase_storage_admin, supabase_auth_admin, supabase_realtime_admin;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, supabase_storage_admin, supabase_auth_admin, supabase_realtime_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, supabase_storage_admin, supabase_auth_admin, supabase_realtime_admin;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO supabase_auth_admin;

-- Note: auth.uid()/auth.role() は GoTrue のマイグレーションで作成されるため
-- ここでは作成しない（所有者衝突を避ける）

-- Create storage schema if not exists
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT CREATE ON SCHEMA storage TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON FUNCTIONS TO supabase_storage_admin;

-- Create realtime schema if not exists
CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT USAGE ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON TABLES TO supabase_realtime_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON SEQUENCES TO supabase_realtime_admin;

-- Note: We no longer create auth.users or seed users here.
-- Supabase Auth (GoTrue) manages the auth schema and will migrate it on startup.
-- Application tables and seeds are handled via Supabase migrations and/or app lifecycle.

-- Keep "challenges" base table and a few seed rows so that
-- badge system initialization can ALTER/UPDATE it reliably.
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(20),
    duration INTEGER NOT NULL,
    participants INTEGER DEFAULT 0,
    current_day INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    reward VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a few baseline challenges (idempotent by title)
DO $$
BEGIN
  INSERT INTO challenges (title, description, category, difficulty, duration, participants, progress, reward)
  SELECT '30日プランクチャレンジ', '毎日少しずつプランクの時間を伸ばして、30日で3分間プランクを達成', '体幹強化', '初級', 30, 127, 60, 'プランクマスターバッジ'
  WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = '30日プランクチャレンジ');

  INSERT INTO challenges (title, description, category, difficulty, duration, participants, progress, reward)
  SELECT '週5日運動習慣', '週5日間、何かしらの運動を継続するチャレンジ', '習慣化', '中級', 28, 89, 54, 'コンシステンシーバッジ'
  WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = '週5日運動習慣');

  INSERT INTO challenges (title, description, category, difficulty, duration, participants, progress, reward)
  SELECT '10000歩ウォーキング', '毎日10000歩以上歩くチャレンジ', '有酸素運動', '初級', 21, 234, 57, 'ウォーカーバッジ'
  WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = '10000歩ウォーキング');
END$$;

-- Create base posts table required by later migrations (idempotent)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    privacy VARCHAR(20) DEFAULT 'public',
    post_type VARCHAR(50) DEFAULT 'general',
    media_urls TEXT[] DEFAULT '{}',
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
