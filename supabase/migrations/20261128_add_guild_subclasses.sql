-- Guild-scoped homebrew subclasses. Mirrors guild_feats; `data` holds a
-- SubclassImport ({ name, parentClass, description?, features[] }).

CREATE TABLE IF NOT EXISTS guild_subclasses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    TEXT NOT NULL REFERENCES registered_guilds(guild_id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guild_subclasses_guild_id ON guild_subclasses(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_subclasses_created_by ON guild_subclasses(created_by);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guild_subclasses_guild_class_name
  ON guild_subclasses(guild_id, (data->>'parentClass'), (data->>'name'));

CREATE TRIGGER set_updated_at_guild_subclasses
  BEFORE UPDATE ON guild_subclasses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE guild_subclasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guild subclasses are viewable by all authenticated users"
  ON guild_subclasses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create subclasses for their guilds"
  ON guild_subclasses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own guild subclasses"
  ON guild_subclasses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own guild subclasses"
  ON guild_subclasses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
