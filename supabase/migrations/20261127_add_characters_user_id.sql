-- Owner of characters created through the MCP server (service role). Nullable so
-- anonymous in-app shares keep working.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
