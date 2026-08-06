/**
 * Discord guild metadata returned by the Discord API.
 *
 * @see https://discord.com/developers/docs/resources/user#get-current-user-guilds
 */
export interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  features: string[]
}
