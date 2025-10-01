#!/bin/bash

# MusclePal - Auto Migration Script
# 初回Docker起動時に自動でマイグレーションを実行

set -e

echo "🔍 Checking auto-migration settings..."

# 環境変数チェック
AUTO_MIGRATE=${AUTO_MIGRATE:-false}
SKIP_MIGRATION=${SKIP_MIGRATION:-false}

if [ "$SKIP_MIGRATION" = "true" ]; then
    echo "⏭️  Migration skipped (SKIP_MIGRATION=true)"
    exit 0
fi

if [ "$AUTO_MIGRATE" != "true" ]; then
    echo "ℹ️  Auto-migration disabled (AUTO_MIGRATE=${AUTO_MIGRATE})"
    echo "   To enable: set AUTO_MIGRATE=true"
    exit 0
fi

echo "🚀 Starting auto-migration process..."

# Supabaseサービスが起動するまで待機
wait_for_service() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within timeout"
    return 1
}

# 必要なサービスの起動を待機
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec muscle-pal-db pg_isready -U postgres -d postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL connection..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

wait_for_service "http://localhost:8000/auth/v1/settings" "Auth Service" || exit 1

echo "⏳ Waiting for Storage schema to be ready..."
# Wait for required storage tables to exist before applying migrations touching storage.*
MAX_ATTEMPTS=30
ATTEMPT=1
until docker exec muscle-pal-db psql -U postgres -tAc "SELECT to_regclass('storage.buckets') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL;" | grep -q t; do
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "❌ storage schema not ready after $MAX_ATTEMPTS attempts"
    break
  fi
  echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for storage tables..."
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

echo "🗄️  Running Supabase migrations..."

# マイグレーション実行
echo "🔧 Setting up Supabase configuration for Docker..."

# Docker環境用のSupabase設定を一時的に作成
export SUPABASE_DB_URL="postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres"

# マイグレーションファイルを直接PostgreSQLに適用
echo "📁 Applying migration files..."
migration_success=true

# 各マイグレーションファイルを順番に適用
for migration_file in supabase/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "   Applying: $(basename "$migration_file")"
        if ! docker exec muscle-pal-db psql -U postgres -d postgres -f "/docker-entrypoint-initdb.d/migrations/$(basename "$migration_file")" > /dev/null 2>&1; then
            echo "   ❌ Failed to apply: $(basename "$migration_file")"
            migration_success=false
        else
            echo "   ✅ Applied: $(basename "$migration_file")"
        fi
    fi
done

if [ "$migration_success" = true ]; then
    echo "✅ Migrations completed successfully!"
    
    # マイグレーション完了フラグを作成
    touch .docker-migration-completed
    echo "📝 Created migration completion flag"
    
else
    echo "❌ Some migrations failed!"
    exit 1
fi

echo "🎉 Auto-migration setup complete!"
