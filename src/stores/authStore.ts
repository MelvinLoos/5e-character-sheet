import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createSupabaseClient } from '../infra/supabaseClient'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

export type AuthStatus = 'loggedOut' | 'loading' | 'authenticated'

/**
 * Module-level (non-reactive) storage for the Discord OAuth provider token.
 * Kept out of Pinia's reactive state to prevent inspection via Vue Devtools
 * and browser console.
 */
let _providerToken: string | null = null

export const useAuthStore = defineStore('auth', () => {
  const supabase = createSupabaseClient()

  // State
  const status = ref<AuthStatus>('loggedOut')
  const userId = ref<string | null>(null)
  const discordUsername = ref<string | null>(null)
  const discordAvatarUrl = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => status.value === 'authenticated')
  const isLoading = computed(() => status.value === 'loading')

  function updateUserFromSession(session: Session | null) {
    const user = session?.user ?? null
    userId.value = user?.id ?? null
    discordUsername.value = user?.user_metadata?.full_name ?? null
    discordAvatarUrl.value = user?.user_metadata?.avatar_url ?? null
    _providerToken = (session?.provider_token as string | undefined) ?? null
  }

  function handleAuthChange(event: AuthChangeEvent, session: Session | null) {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      status.value = 'authenticated'
      updateUserFromSession(session)
    } else if (event === 'SIGNED_OUT') {
      status.value = 'loggedOut'
      userId.value = null
      discordUsername.value = null
      discordAvatarUrl.value = null
      _providerToken = null
    }
  }

  // Actions
  async function initialize() {
    if (!supabase) {
      logger.warn('Supabase client not available. Auth is disabled.')
      return
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      logger.error('Error retrieving auth session:', error.message)
      status.value = 'loggedOut'
      return
    }

    if (data.session) {
      status.value = 'authenticated'
      updateUserFromSession(data.session)
    } else {
      status.value = 'loggedOut'
    }

    supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(event, session)
    })
  }

  async function signInWithDiscord() {
    if (!supabase) {
      logger.warn('Supabase client not available. Cannot sign in.')
      return
    }

    status.value = 'loading'

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify guilds',
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      logger.error('Discord OAuth sign-in error:', error.message)
      status.value = 'loggedOut'
      return
    }

    status.value = 'authenticated'
  }

  async function signOut() {
    if (!supabase) {
      status.value = 'loggedOut'
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error('Sign out error:', error.message)
      return
    }

    status.value = 'loggedOut'
    userId.value = null
    discordUsername.value = null
    discordAvatarUrl.value = null
    _providerToken = null
  }

  async function handleAuthCallback(accessToken: string, refreshToken: string) {
    if (!supabase) {
      status.value = 'loggedOut'
      return
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      logger.error('Auth callback error:', error?.message ?? 'No session returned')
      status.value = 'loggedOut'
      userId.value = null
      discordUsername.value = null
      discordAvatarUrl.value = null
      _providerToken = null
      return
    }

    status.value = 'authenticated'
    updateUserFromSession(data.session)
  }

  /**
   * Non-reactive getter for the Discord OAuth provider token.
   * Use this instead of directly accessing the value for internal consumers
   * that need to pass the token to the Discord API.
   */
  function getProviderToken(): string | null {
    return _providerToken
  }

  return {
    // State
    status,
    userId,
    discordUsername,
    discordAvatarUrl,
    // Getter
    getProviderToken,
    // Getters
    isAuthenticated,
    isLoading,
    // Actions
    initialize,
    signInWithDiscord,
    signOut,
    handleAuthCallback,
  }
})
