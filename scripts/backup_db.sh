#!/usr/bin/env bash
# 本機 DB 備份腳本 — 用 pg_dump 備份 prod (public schema)
# Usage: bash scripts/backup_db.sh [--sql]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
ENV_FILE="$PROJECT_ROOT/backend/.env"

# ── 檢查 pg_dump ──
if ! command -v pg_dump &>/dev/null; then
    echo "Error: pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

# ── 讀取 DATABASE_URL ──
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | sed 's/^DATABASE_URL=//')

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in $ENV_FILE"
    exit 1
fi

# ── 解析連線字串 ──
# postgresql://user:password@host:port/dbname
PROTO="$(echo "$DATABASE_URL" | sed -e 's|://.*||')"
URL_BODY="$(echo "$DATABASE_URL" | sed -e "s|${PROTO}://||")"

USERINFO="$(echo "$URL_BODY" | sed -e 's|@.*||')"
HOSTINFO="$(echo "$URL_BODY" | sed -e 's|.*@||' -e 's|/.*||')"
DBNAME="$(echo "$URL_BODY" | sed -e 's|.*/||')"

PGUSER="$(echo "$USERINFO" | sed -e 's|:.*||')"
PGPASSWORD="$(echo "$USERINFO" | sed -e 's|[^:]*:||')"
PGHOST="$(echo "$HOSTINFO" | sed -e 's|:.*||')"
PGPORT="$(echo "$HOSTINFO" | grep -oE ':[0-9]+' | tr -d ':' || echo '5432')"
PGPORT="${PGPORT:-5432}"

export PGPASSWORD

# ── 判斷輸出格式 ──
FORMAT="custom"
EXT="dump"

if [ "$1" = "--sql" ]; then
    FORMAT="plain"
    EXT="sql"
fi

# ── 建立備份目錄 ──
mkdir -p "$BACKUP_DIR"

# ── 執行備份 ──
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="vtaxon_prod_${TIMESTAMP}.${EXT}"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "Backing up public schema from $PGHOST:$PGPORT/$DBNAME ..."

pg_dump \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$DBNAME" \
    --schema=public \
    --no-owner \
    --no-privileges \
    --format="$FORMAT" \
    --file="$FILEPATH"

# ── 結果 ──
FILESIZE=$(du -h "$FILEPATH" | cut -f1)
echo ""
echo "Backup complete!"
echo "  File: $FILEPATH"
echo "  Size: $FILESIZE"
