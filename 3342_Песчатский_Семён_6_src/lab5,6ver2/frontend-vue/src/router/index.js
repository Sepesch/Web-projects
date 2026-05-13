import { createRouter, createWebHistory } from 'vue-router'
import { useBrokerStore } from '../stores/broker'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminBrokers.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const brokerStore = useBrokerStore()
  
  if (to.meta.requiresAuth && !brokerStore.currentBroker) {
    next('/')
  } else {
    next()
  }
})

export default router