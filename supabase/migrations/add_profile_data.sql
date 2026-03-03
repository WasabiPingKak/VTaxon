-- Add profile_data JSONB column to users table
-- Stores optional profile fields: debut_date, birthday, blood_type, mbti,
-- gender, representative_emoji, fan_name, activity_status, illustrators,
-- riggers, modelers_3d, hashtags, debut_video_url
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';
