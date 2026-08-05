import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

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
          // Expose the update function so UpdateNotification can trigger it
          ;(window as unknown as Record<string, unknown>).__swUpdate = updateSW
        }
      },
    })
  } catch {
    // Service worker not available (dev mode or unsupported browser)
  }
}

initServiceWorker()