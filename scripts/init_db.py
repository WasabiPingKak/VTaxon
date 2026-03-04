#!/usr/bin/env python3
"""VTaxon 資料庫初始化腳本。

從 backend/.env 讀取 DATABASE_URL，依序執行 schema 和 seed SQL 檔案。
支援 staging（使用 staging schema）和 prod（使用 public schema）兩種模式。

Usage:
    python scripts/init_db.py --target staging          # 完整初始化 staging
    python scripts/init_db.py --target prod             # 完整初始化 production
    python scripts/init_db.py --target staging --schema-only  # 只建表
    python scripts/init_db.py --target staging --seed-only    # 只跑 seed
"""

import argparse
import os
import sys
import time
from pathlib import Path

import psycopg2

# 專案根目錄
ROOT_DIR = Path(__file__).resolve().parent.parent

# Schema 檔案
INIT_SQL = ROOT_DIR / "supabase" / "init.sql"
INIT_STAGING_SQL = ROOT_DIR / "supabase" / "init_staging.sql"

# Seed 檔案（依序執行）
SEED_FILES = [
    ROOT_DIR / "backend" / "seeds" / "fictional_species.sql",
    ROOT_DIR / "backend" / "seeds" / "fictional_species_expansion.sql",
    ROOT_DIR / "backend" / "seeds" / "fictional_species_egyptian.sql",
    ROOT_DIR / "backend" / "seeds" / "fictional_species_taiwan.sql",
    ROOT_DIR / "backend" / "seeds" / "breeds.sql",
]


def load_database_url() -> str:
    """從 backend/.env 讀取 DATABASE_URL。"""
    env_path = ROOT_DIR / "backend" / ".env"
    if not env_path.exists():
        print(f"錯誤：找不到 {env_path}")
        sys.exit(1)

    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1]

    print("錯誤：backend/.env 中找不到 DATABASE_URL")
    sys.exit(1)


def execute_sql_file(cursor, filepath: Path, label: str) -> bool:
    """執行單一 SQL 檔案，回傳是否成功。"""
    if not filepath.exists():
        print(f"  ✗ {label} — 檔案不存在：{filepath}")
        return False

    sql = filepath.read_text(encoding="utf-8")
    try:
        cursor.execute(sql)
        print(f"  ✓ {label}")
        return True
    except Exception as e:
        print(f"  ✗ {label} — {e}")
        return False


def run_schema(conn, target: str):
    """建立 schema 和表。"""
    print(f"\n{'='*50}")
    print(f"建立 Schema（{target}）")
    print(f"{'='*50}")

    with conn.cursor() as cur:
        # 兩種模式都需要先執行 init.sql（建立 public 表 + update_updated_at 函式）
        if not execute_sql_file(cur, INIT_SQL, "supabase/init.sql（public schema）"):
            conn.rollback()
            return False
        conn.commit()

        if target == "staging":
            # 再建立 staging schema 的表
            if not execute_sql_file(cur, INIT_STAGING_SQL, "supabase/init_staging.sql（staging schema）"):
                conn.rollback()
                return False
            conn.commit()

    return True


def run_seeds(conn, target: str):
    """執行 seed 檔案。"""
    print(f"\n{'='*50}")
    print(f"執行 Seed 資料（{target}）")
    print(f"{'='*50}")

    with conn.cursor() as cur:
        if target == "staging":
            cur.execute("SET search_path TO staging, public;")
            print("  → search_path 設為 staging, public")

        for seed_file in SEED_FILES:
            label = str(seed_file.relative_to(ROOT_DIR))
            if not execute_sql_file(cur, seed_file, label):
                conn.rollback()
                return False
            conn.commit()

    return True


def main():
    parser = argparse.ArgumentParser(description="VTaxon 資料庫初始化")
    parser.add_argument(
        "--target",
        choices=["staging", "prod"],
        default="staging",
        help="目標環境（預設：staging）",
    )
    parser.add_argument(
        "--schema-only",
        action="store_true",
        help="只建表，不執行 seed",
    )
    parser.add_argument(
        "--seed-only",
        action="store_true",
        help="只執行 seed，不建表（表已存在時用）",
    )
    args = parser.parse_args()

    if args.schema_only and args.seed_only:
        print("錯誤：--schema-only 和 --seed-only 不能同時使用")
        sys.exit(1)

    database_url = load_database_url()
    print(f"目標環境：{args.target}")
    # 只顯示 host，隱藏密碼
    host_part = database_url.split("@")[-1] if "@" in database_url else "***"
    print(f"資料庫：{host_part}")

    start = time.time()

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
    except Exception as e:
        print(f"錯誤：無法連線到資料庫 — {e}")
        sys.exit(1)

    try:
        success = True

        if not args.seed_only:
            success = run_schema(conn, args.target)

        if success and not args.schema_only:
            success = run_seeds(conn, args.target)

        elapsed = time.time() - start

        if success:
            print(f"\n完成！耗時 {elapsed:.1f} 秒")
        else:
            print(f"\n執行失敗，已回滾。耗時 {elapsed:.1f} 秒")
            sys.exit(1)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
