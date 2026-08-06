import { describe, it, expect } from 'vitest'
import { hasAdminPermission } from '../src/utils/guildPermissions'

describe('hasAdminPermission', () => {
  it('returns true for a user with ADMINISTRATOR permission (0x8 = 8)', () => {
    expect(hasAdminPermission('8')).toBe(true)
  })

  it('returns true for a user with MANAGE_GUILD permission (0x20 = 32)', () => {
    expect(hasAdminPermission('32')).toBe(true)
  })

  it('returns true when both ADMINISTRATOR and MANAGE_GUILD are set in the bitfield', () => {
    // 8 | 32 = 40
    expect(hasAdminPermission('40')).toBe(true)
  })

  it('returns true when ADMINISTRATOR is set among many other permissions', () => {
    // A realistic bitfield with ADMINISTRATOR among other flags
    // 104189505 in decimal has bits set for many permissions including ADMINISTRATOR
    // We verify by checking BigInt(104189505) & BigInt(8) = 0 (doesn't have admin)
    // Let's use a value that clearly includes ADMINISTRATOR
    const bigBitfield = String(8 | 1 | 2 | 16) // 27 = ADMIN + CREATE_INSTANT_INVITE + KICK_MEMBERS + MANAGE_CHANNELS
    expect(hasAdminPermission(bigBitfield)).toBe(true)
  })

  it('returns true when MANAGE_GUILD is set among other permissions', () => {
    const bigBitfield = String(32 | 1 | 2 | 16) // 51 = MANAGE_GUILD + misc
    expect(hasAdminPermission(bigBitfield)).toBe(true)
  })

  it('returns false for a user with no admin-like permissions (0)', () => {
    expect(hasAdminPermission('0')).toBe(false)
  })

  it('returns false for a user with unrelated permissions only', () => {
    // Permissions that are neither ADMINISTRATOR (8) nor MANAGE_GUILD (32)
    // CREATE_INSTANT_INVITE (1) + KICK_MEMBERS (2) + MANAGE_CHANNELS (16) = 19
    expect(hasAdminPermission('19')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(hasAdminPermission('')).toBe(false)
  })

  it('returns false for a non-numeric string', () => {
    expect(hasAdminPermission('abc')).toBe(false)
  })

  it('returns false for a negative number string', () => {
    expect(hasAdminPermission('-1')).toBe(false)
  })
})