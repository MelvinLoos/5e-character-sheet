/**
 * Centralized registry for all localStorage keys used across the application.
 */
export const STORAGE_KEYS = {
  CHARACTER_LIBRARY: 'dnd_character_library',
  CURRENT_CHARACTER_ID: 'dnd_current_character_id',
  CURRENT_DRAFT: 'dnd_current_draft',
  APP_THEME: 'dnd_app_theme',
  USER_SETTINGS: 'dnd_user_settings',
} as const;

/**
 * Centralized registry for all sessionStorage keys used across the application.
 */
export const SESSION_KEYS = {
  ACTIVE_SESSION_NAME: 'dnd_active_session_name',
  SHARE_TOKEN: 'dnd_share_token',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type SessionKey = typeof SESSION_KEYS[keyof typeof SESSION_KEYS];