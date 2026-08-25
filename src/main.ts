import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initSupabase } from './infra/sharingService'
import { setSwUpdateCallback } from './utils/swUpdateBus'
import { initPostHog, capturePostHogException } from './utils/posthog'

const app = createApp(App)

initPostHog()

app.use(createPinia())
app.use(router)

app.config.errorHandler = (error) => {
  capturePostHogException(error)
}

app.mount('#app')

// Initialize Supabase client before auth so guild stores can query
// registered_guilds without racing on client readiness.
initSupabase()

// Initialize auth state restoration after app mount
// This ensures Pinia is active and the router guard won't race with explicit init
import { initializeAuth } from './router'
initializeAuth().catch(() => {
  // Auth initialization errors are logged by the auth store
})

// Service Worker registration for automatic updates
async function initServiceWorker() {
  try {
    const { registerSW } = await import('virtual:pwa-register')

    const updateSW = registerSW({
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent('sw-update-available'))
      },
      onOfflineReady() {
        console.log('App is ready to work offline')
      },
      onRegistered(registration: ServiceWorkerRegistration | undefined) {
        if (registration) {
          // Store the update callback in a module-level closure so UpdateNotification
          // can trigger it without exposing it on the global window object.
          setSwUpdateCallback(updateSW)
        }
      },
    })
  } catch {
    // Service worker not available (dev mode or unsupported browser)
  }
}

initServiceWorker()