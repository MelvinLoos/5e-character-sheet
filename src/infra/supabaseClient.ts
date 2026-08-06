import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseCredentials } from '../constants/supabase'

/**
 * Module-level cache for the default (anonymous) Supabase client.
 * Ensures only one GoTrueClient instance is created, preventing
 * the "Multiple GoTrueClient instances" warning from the Supabase SDK.
 */
let _defaultClient: SupabaseClient | null | undefined

/**
 * Creates or retrieves a Supabase client instance.
 *
 * When called without a session token, a singleton anonymous client is
 * returned — the same instance is reused across all call sites (auth store,
 * sharing service, etc.) to avoid duplicate GoTrueClient instances.
 *
 * When a session token is provided, a new client is created each time
 * (scoped to that specific authenticated session).
 */
export function createSupabaseClient(sessionToken?: string): SupabaseClient | null {
  if (!hasSupabaseCredentials()) {
    logger.warn('Supabase credentials not found. Online sharing and auth are disabled.')
    return null
  }

  // Return the cached anonymous client when no session token is needed
  if (!sessionToken) {
    if (_defaultClient !== undefined) {
      return _defaultClient
    }

    try {
      _defaultClient = createClient(getSupabaseUrl(), getSupabaseAnonKey())
      return _defaultClient
    } catch (e) {
      logger.error('Error initializing Supabase client:', (e as Error).message)
      _defaultClient = null
      return null
    }
  }

  // Authenticated requests — create a new client with the session token
  try {
    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })
  } catch (e) {
    logger.error('Error initializing authenticated Supabase client:', (e as Error).message)
    return null
  }
}
