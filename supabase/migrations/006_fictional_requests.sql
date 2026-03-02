-- Migration: fictional_species_requests table
-- Stores user-submitted suggestions for new fictional species

CREATE TABLE IF NOT EXISTS fictional_species_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name_zh TEXT NOT NULL,
    name_en TEXT,
    suggested_origin TEXT,
    suggested_sub_origin TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE fictional_species_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own requests"
    ON fictional_species_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
    ON fictional_species_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
    ON fictional_species_requests FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
