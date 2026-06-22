import { createRouter, createWebHistory } from 'vue-router'
import Identity from '../views/Identity.vue'

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
      path: '/combat',
      name: 'combat',
      component: () => import('../views/Combat.vue'),
    },
    {
      path: '/spells',
      name: 'spells',
      component: () => import('../views/Spells.vue'),
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
  ],
})

export default router
