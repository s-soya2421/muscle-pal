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
        CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    ELSE
        ALTER USER supabase_auth_admin PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
    
    -- Create supabase_storage_admin user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE USER supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    ELSE
        ALTER USER supabase_storage_admin PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
    
    -- Grant database-level permissions to storage admin
    GRANT CONNECT ON DATABASE postgres TO supabase_storage_admin;
    GRANT CREATE ON DATABASE postgres TO supabase_storage_admin;
    
    -- Create supabase_realtime_admin user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        CREATE USER supabase_realtime_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    ELSE
        ALTER USER supabase_realtime_admin PASSWORD 'your-super-secret-and-long-postgres-password';
    END IF;
    
    -- Create authenticator user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE USER authenticator NOINHERIT LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
    ELSE
        ALTER USER authenticator PASSWORD 'your-super-secret-and-long-postgres-password';
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