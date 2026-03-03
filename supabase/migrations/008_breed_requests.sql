-- Migration: breed_requests table
-- Stores user-submitted suggestions for missing breeds

CREATE TABLE IF NOT EXISTS breed_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    taxon_id INTEGER REFERENCES species_cache(taxon_id),
    name_zh TEXT,
    name_en TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE breed_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own breed requests"
    ON breed_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own breed requests"
    ON breed_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all breed requests"
    ON breed_requests FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
