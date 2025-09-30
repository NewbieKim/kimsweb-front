import { createRouter, createWebHistory } from 'vue-router';
import { useStore } from '../store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: false },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('../views/Products.vue')
        },
        {
          path: 'products/add',
          name: 'AddProduct',
          component: () => import('../views/ProductForm.vue')
        },
        {
          path: 'products/edit/:id',
          name: 'EditProduct',
          component: () => import('../views/ProductForm.vue')
        }
      ]
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const store = useStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !store.isLoggedIn) {
    next('/login');
  } else if (to.path === '/login' && store.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;
