import { createRouter, createWebHashHistory, createWebHistory  } from 'vue-router';
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/home', component: () => import('@/views/home/index.vue') },
    { path: '/user', component: () => import('@/views/user/index.vue') }
  ]
})

export default router