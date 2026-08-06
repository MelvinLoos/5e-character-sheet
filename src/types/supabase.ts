/**
 * TypeScript definitions for the Supabase database schema.
 *
 * These interfaces reflect the tables defined in:
 * supabase/migrations/20250608_init_guild_content.sql
 */

/**
 * A Discord guild that has been registered in the app.
 * Maps 1:1 to the `registered_guilds` table.
 */
export interface RegisteredGuild {
  /** Discord guild (server) snowflake ID */
  guild_id: string
  /** Human-readable guild name for display */
  guild_name: string
  /** UUID of the Supabase auth user who registered the guild */
  created_by: string
  /** ISO-8601 timestamp of when the guild was registered */
  created_at: string
}

/**
 * Base shape shared by guild-scoped homebrew content tables.
 */
export interface GuildContentBase {
  /** UUID primary key */
  id: string
  /** Foreign key to `registered_guilds.guild_id` */
  guild_id: string
  /** UUID of the Supabase auth user who created this content */
  created_by: string
  /** ISO-8601 timestamp of creation */
  created_at: string
  /** ISO-8601 timestamp of last update */
  updated_at: string
}

/**
 * A guild-scoped homebrew spell entry.
 * Maps 1:1 to the `guild_spells` table.
 */
export interface GuildSpell extends GuildContentBase {
  /** JSONB payload containing the spell definition */
  data: Record<string, unknown>
}

/**
 * A guild-scoped homebrew feat entry.
 * Maps 1:1 to the `guild_feats` table.
 */
export interface GuildFeat extends GuildContentBase {
  /** JSONB payload containing the feat definition */
  data: Record<string, unknown>
}