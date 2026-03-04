-- Seed diverse profile_data + oauth_accounts for __TEST__ users
-- Run in Supabase SQL Editor

-- =============================================
-- 1. Profile data (gender, status, debut, emoji)
-- =============================================
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM users
  WHERE organization = '__TEST__'
),
new_data AS (
  SELECT
    id,
    jsonb_build_object(
      'activity_status',
      CASE
        WHEN rn % 6 IN (0, 1, 2, 3) THEN 'active'
        WHEN rn % 6 = 4 THEN 'hiatus'
        ELSE 'preparing'
      END,
      'debut_date',
      CASE
        WHEN rn % 6 = 5 THEN '2026-12-01'
        ELSE '2024-' || LPAD(((rn % 12) + 1)::text, 2, '0') || '-' || LPAD(((rn % 28) + 1)::text, 2, '0')
      END,
      'representative_emoji',
      (ARRAY['🐹','🐾','🌟','💫','🎀','🔥','❄️','🌸','🎮','⚡'])[((rn - 1) % 10) + 1]
    )
    ||
    CASE
      WHEN rn % 10 IN (1, 2, 3, 4) THEN '{"gender":"女"}'::jsonb
      WHEN rn % 10 IN (5, 6, 7) THEN '{"gender":"男"}'::jsonb
      WHEN rn % 10 = 8 THEN '{"gender":"非二元"}'::jsonb
      ELSE '{}'::jsonb
    END AS pd
  FROM numbered
)
UPDATE users
SET profile_data = nd.pd
FROM new_data nd
WHERE users.id = nd.id;

-- =============================================
-- 2. Clear country_flags for ~12% (test 無國旗)
-- =============================================
WITH to_clear AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM users
  WHERE organization = '__TEST__'
)
UPDATE users
SET country_flags = '[]'::jsonb
FROM to_clear
WHERE users.id = to_clear.id AND to_clear.rn % 8 = 0;

-- =============================================
-- 3. OAuth accounts (platform filter testing)
--    ~75% YouTube, ~40% Twitch, some both
--    Delete existing test oauth_accounts first
-- =============================================
DELETE FROM oauth_accounts
WHERE user_id IN (SELECT id FROM users WHERE organization = '__TEST__')
  AND provider_account_id LIKE 'test_%';

-- YouTube accounts (~75% of test users)
WITH numbered AS (
  SELECT id, display_name, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM users
  WHERE organization = '__TEST__'
)
INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id, provider_display_name, created_at)
SELECT
  gen_random_uuid()::text,
  id,
  'youtube',
  'test_yt_' || rn,
  display_name,
  NOW()
FROM numbered
WHERE rn % 4 != 0   -- skip every 4th → ~75% have YouTube
ON CONFLICT DO NOTHING;

-- Twitch accounts (~40% of test users)
WITH numbered AS (
  SELECT id, display_name, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM users
  WHERE organization = '__TEST__'
)
INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id, provider_display_name, created_at)
SELECT
  gen_random_uuid()::text,
  id,
  'twitch',
  'test_tw_' || rn,
  display_name,
  NOW()
FROM numbered
WHERE rn % 5 IN (0, 1)   -- ~40% have Twitch
ON CONFLICT DO NOTHING;

-- =============================================
-- Verify
-- =============================================
SELECT
  u.display_name,
  u.country_flags,
  u.profile_data->>'gender' AS gender,
  u.profile_data->>'activity_status' AS status,
  u.profile_data->>'debut_date' AS debut,
  u.profile_data->>'representative_emoji' AS emoji,
  array_agg(DISTINCT o.provider) FILTER (WHERE o.provider IS NOT NULL) AS platforms
FROM users u
LEFT JOIN oauth_accounts o ON u.id = o.user_id
WHERE u.organization = '__TEST__'
GROUP BY u.id
ORDER BY u.created_at
LIMIT 30;
