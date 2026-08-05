import { createRouter, createWebHistory } from 'vue-router'
import Identity from '../views/Identity.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/identity',
    },
    {
      path: '/identity',
      name: 'identity',
      component: Identity,
    },
    {
      path: '/skills',
      name: 'skills',
      component: () => import('../views/Skills.vue'),
    },
    {
      path: '/narrative',
      name: 'narrative',
      component: () => import('../views/Narrative.vue'),
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/Inventory.vue'),
    },
    {
      path: '/feats',
      name: 'feats',
      component: () => import('../views/Feats.vue'),
    },
    {
      path: '/spells',
      name: 'spells',
      component: () => import('../views/Spells.vue'),
    },
    {
      path: '/auth/callback',
      name: 'authCallback',
      component: Identity,
      beforeEnter: async (to) => {
        const authStore = useAuthStore()
        const hashParams = new URLSearchParams(to.hash.replace(/^#/, ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          await authStore.handleAuthCallback(accessToken, refreshToken)
          return { name: 'identity' }
        }

        return { name: 'identity', query: { error: 'auth_callback_failed' } }
      },
    },
  ],
})

let authInitialized = false

router.beforeEach(async () => {
  if (!authInitialized) {
    const authStore = useAuthStore()
    await authStore.initialize()
    authInitialized = true
  }
})

export async function initializeAuth(): Promise<void> {
  if (authInitialized) return
  const authStore = useAuthStore()
  await authStore.initialize()
  authInitialized = true
}

export default router
