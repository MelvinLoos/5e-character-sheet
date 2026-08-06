-- =============================================================================
-- Migration: Initialize guild homebrew content tables
-- Sub-Issue 3: Supabase Schema, RLS & Guild Filtering
-- Created: 2025-06-08
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: auto-updating `updated_at` trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Table: registered_guilds
-- Tracks which Discord servers have opted into the app.
-- =============================================================================
CREATE TABLE IF NOT EXISTS registered_guilds (
  guild_id    TEXT PRIMARY KEY,
  guild_name  TEXT NOT NULL DEFAULT '',
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table: guild_spells
-- Stores guild-scoped homebrew spells as JSONB.
-- =============================================================================
CREATE TABLE IF NOT EXISTS guild_spells (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    TEXT NOT NULL REFERENCES registered_guilds(guild_id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table: guild_feats
-- Stores guild-scoped homebrew feats as JSONB (identical structure to spells).
-- =============================================================================
CREATE TABLE IF NOT EXISTS guild_feats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    TEXT NOT NULL REFERENCES registered_guilds(guild_id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes for guild-scoped lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_guild_spells_guild_id ON guild_spells(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_spells_created_by ON guild_spells(created_by);
CREATE INDEX IF NOT EXISTS idx_guild_feats_guild_id ON guild_feats(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_feats_created_by ON guild_feats(created_by);

-- ---------------------------------------------------------------------------
-- `updated_at` triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER set_updated_at_guild_spells
  BEFORE UPDATE ON guild_spells
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_guild_feats
  BEFORE UPDATE ON guild_feats
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all three tables
ALTER TABLE registered_guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_spells      ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_feats       ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- registered_guilds policies
-- ---------------------------------------------------------------------------

-- Anyone authenticated can see which guilds are registered (needed for filtering)
CREATE POLICY "Registered guilds are viewable by all authenticated users"
  ON registered_guilds
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the creator can insert a guild registration
CREATE POLICY "Users can register their own guilds"
  ON registered_guilds
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update their registered guild
CREATE POLICY "Users can update their own registered guilds"
  ON registered_guilds
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can delete their registered guild
CREATE POLICY "Users can delete their own registered guilds"
  ON registered_guilds
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- guild_spells policies
-- ---------------------------------------------------------------------------

-- All authenticated users can read guild spells (content is meant to be shared)
CREATE POLICY "Guild spells are viewable by all authenticated users"
  ON guild_spells
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users who are the creator can insert
CREATE POLICY "Users can create spells for their guilds"
  ON guild_spells
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update
CREATE POLICY "Users can update their own guild spells"
  ON guild_spells
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can delete
CREATE POLICY "Users can delete their own guild spells"
  ON guild_spells
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- guild_feats policies (identical to spells)
-- ---------------------------------------------------------------------------

CREATE POLICY "Guild feats are viewable by all authenticated users"
  ON guild_feats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create feats for their guilds"
  ON guild_feats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own guild feats"
  ON guild_feats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own guild feats"
  ON guild_feats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);