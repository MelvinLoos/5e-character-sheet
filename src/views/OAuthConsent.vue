<script setup lang="ts">
/**
 * OAuth consent screen for Supabase Auth's OAuth 2.1 server. AI agents (MCP
 * clients) send the player here with an `authorization_id`; the player signs
 * in with Discord if needed, then approves or denies the request.
 */
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getSupabaseClient } from '@/infra/sharingService'
import { logger } from '@/utils/logger'
import PressableButton from '@/components/ui/PressableButton.vue'

interface Details {
  authorization_id: string
  client: { name: string }
  redirect_uri: string
  scope?: string
}

const SCOPE_LABELS: Record<string, string> = {
  openid: 'Confirm who you are',
  email: 'See your email address',
  profile: 'See your profile name',
  phone: 'See your phone number',
}

const route = useRoute()
const auth = useAuthStore()
const authorizationId = String(route.query.authorization_id ?? '')

const state = ref<'loading' | 'signin' | 'consent' | 'error'>('loading')
const details = ref<Details | null>(null)
const error = ref('')
const busy = ref(false)

onMounted(async () => {
  const client = getSupabaseClient()
  if (!authorizationId || !client) {
    error.value = 'This authorization request is missing or sign-in is not available.'
    state.value = 'error'
    return
  }
  if (auth.status !== 'authenticated') {
    state.value = 'signin'
    return
  }
  const { data, error: err } = await client.auth.oauth.getAuthorizationDetails(authorizationId)
  if (err || !data) {
    error.value = err?.message ?? 'Invalid authorization request.'
    state.value = 'error'
    return
  }
  // Already consented earlier: Supabase hands back the redirect directly.
  if (!('authorization_id' in data)) {
    window.location.href = (data as { redirect_url: string }).redirect_url
    return
  }
  details.value = data as Details
  state.value = 'consent'
})

function signIn(): void {
  auth.signInWithDiscord(window.location.href)
}

async function decide(approve: boolean): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return
  busy.value = true
  const { data, error: err } = approve
    ? await client.auth.oauth.approveAuthorization(authorizationId)
    : await client.auth.oauth.denyAuthorization(authorizationId)
  if (err || !data) {
    logger.error('OAuth decision failed:', err?.message)
    error.value = err?.message ?? 'Something went wrong.'
    state.value = 'error'
    busy.value = false
    return
  }
  window.location.href = data.redirect_url
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-background px-gutter py-container-padding"
  >
    <section
      class="w-full max-w-md rounded-xl bg-surface-container p-8 shadow-sm"
      data-testid="oauth-consent"
    >
      <h1 class="font-display-lg text-headline-lg text-tertiary">Connect an AI agent</h1>

      <p v-if="state === 'loading'" class="mt-4 text-on-surface-variant">Loading request…</p>

      <template v-else-if="state === 'signin'">
        <p class="mt-4 text-on-surface-variant">
          An AI agent wants to use your Heroes Guild account. Sign in with Discord to review the
          request.
        </p>
        <PressableButton class="mt-6" variant="primary" @click="signIn"
          >Sign in with Discord</PressableButton
        >
      </template>

      <template v-else-if="state === 'consent' && details">
        <p class="mt-4 text-on-surface">
          <strong>{{ details.client.name }}</strong> wants to act for you in the Character Sheet.
        </p>
        <p class="mt-2 text-sm text-on-surface-variant">
          It will be able to read your guilds' homebrew spells and feats and create characters on
          your behalf. It cannot see or change the characters saved on your devices.
        </p>
        <ul
          v-if="details.scope?.trim()"
          class="mt-4 list-disc space-y-1 pl-6 text-on-surface-variant"
        >
          <li v-for="scope in details.scope.trim().split(/\s+/)" :key="scope">
            {{ SCOPE_LABELS[scope] ?? scope }}
          </li>
        </ul>
        <p class="mt-4 break-all text-xs text-on-surface-variant">
          Returns to {{ details.redirect_uri }}
        </p>
        <div class="mt-6 flex gap-3">
          <PressableButton variant="primary" :loading="busy" @click="decide(true)"
            >Approve</PressableButton
          >
          <PressableButton variant="secondary" :disabled="busy" @click="decide(false)"
            >Deny</PressableButton
          >
        </div>
      </template>

      <p v-else class="mt-4 text-error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>
