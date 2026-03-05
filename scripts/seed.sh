#!/usr/bin/env bash
# 一鍵匯入 seed 資料到 staging + production
# Usage: bash scripts/seed.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 找到有 psycopg2 的 Python
if python -c "import psycopg2" 2>/dev/null; then
    PY=python
elif python3 -c "import psycopg2" 2>/dev/null; then
    PY=python3
elif "$HOME/anaconda3/python" -c "import psycopg2" 2>/dev/null; then
    PY="$HOME/anaconda3/python"
else
    echo "Error: psycopg2 not found. Run: pip install psycopg2-binary"
    exit 1
fi

echo "Using Python: $($PY --version 2>&1)"

echo ""
echo "=== Seeding staging ==="
$PY "$SCRIPT_DIR/init_db.py" --target staging --seed-only

echo ""
echo "=== Seeding production ==="
$PY "$SCRIPT_DIR/init_db.py" --target prod --seed-only

echo ""
echo "Done! Both environments updated."
