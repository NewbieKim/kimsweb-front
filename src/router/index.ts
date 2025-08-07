import { createRouter, createWebHashHistory, createWebHistory  } from 'vue-router';
import Layout from '@/layout/index.vue'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/home', component: () => import('@/views/home/index.vue') },
    { path: '/user', component: () => import('@/views/user/index.vue') },
    { path: '/', component: Layout },
  ]
})

export default router