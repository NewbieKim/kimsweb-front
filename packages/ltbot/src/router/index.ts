// import { createRouter, createWebHashHistory, createWebHistory  } from 'vue-router';
// import Layout from '@/layout/index.vue'
// const router = createRouter({
//   history: createWebHashHistory(),
//   routes: [
//     { path: '/home', component: () => import('@/views/home/index.vue') },
//     { path: '/user', component: () => import('@/views/user/index.vue') },
//     { path: '/workbench', component: () => import('@/views/workbench/index.vue') },
//     { path: '/', component: Layout },
//   ]
// })

// export default router
// import { createWebHashHistory, createRouter } from "@/hooks/mockRouter/router";
// const router = createRouter({
//   history: createWebHashHistory(),
//   routes: basicRoutes
// })

// export default router

import { createRouter, createWebHashHistory  } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import type { App } from 'vue';
import { basicRoutes } from './routers';

// 白名单应该包含基本静态路由
const WHITE_NAME_LIST: string[] = [];
const getRouteNames = (array: any[]) =>
  array.forEach((item) => {
    WHITE_NAME_LIST.push(item.name);
    getRouteNames(item.children || []);
  });
getRouteNames(basicRoutes);

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  // routes: routes
  routes: basicRoutes as unknown as RouteRecordRaw[],
});

// config router
// main.ts中使用
export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router
