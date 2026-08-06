/**
 * Discord permission flag constants.
 *
 * @see https://discord.com/developers/docs/topics/permissions
 */
const ADMINISTRATOR = 8n // 0x8
const MANAGE_GUILD = 32n // 0x20

/**
 * Checks whether the given Discord permission bitfield string
 * grants the user administrative authority over a guild.
 *
 * Returns true if the user has either `ADMINISTRATOR` (0x8)
 * or `MANAGE_GUILD` (0x20) permissions.
 *
 * @param permissions - The raw permission string from the Discord API.
 */
export function hasAdminPermission(permissions: string): boolean {
  if (!permissions) return false

  try {
    const bits = BigInt(permissions)
    if (bits < 0n) return false

    return (bits & ADMINISTRATOR) === ADMINISTRATOR
      || (bits & MANAGE_GUILD) === MANAGE_GUILD
  } catch {
    return false
  }
}