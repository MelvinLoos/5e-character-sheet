-- =============================================================================
-- Migration: Add unique constraints for guild content deduplication
-- Bug #106: Prevents duplicate spell/feat names within the same guild.
-- Created: 2026-06-08
-- =============================================================================

-- Unique index on guild_id + spell name (extracted from JSONB "data" field)
CREATE UNIQUE INDEX IF NOT EXISTS idx_guild_spells_guild_name
  ON guild_spells(guild_id, (data->>'name'));

-- Unique index on guild_id + feat title (extracted from JSONB "data" field)
CREATE UNIQUE INDEX IF NOT EXISTS idx_guild_feats_guild_title
  ON guild_feats(guild_id, (data->>'title'));