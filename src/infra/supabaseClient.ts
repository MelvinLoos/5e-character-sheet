import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseCredentials } from '../constants/supabase'

/**
 * Creates a Supabase client instance.
 *
 * If an authenticated session token is provided, the client will be configured
 * with an `Authorization` header for requests that require an authenticated user.
 * Otherwise, an anonymous client is returned for public operations such as
 * loading a shared character.
 */
export function createSupabaseClient(sessionToken?: string): SupabaseClient | null {
  if (!hasSupabaseCredentials()) {
    logger.warn('Supabase credentials not found. Online sharing and auth are disabled.')
    return null
  }

  try {
    const globalHeaders = sessionToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          },
        }
      : {}

    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), globalHeaders)
  } catch (e) {
    logger.error('Error initializing Supabase client:', (e as Error).message)
    return null
  }
}
