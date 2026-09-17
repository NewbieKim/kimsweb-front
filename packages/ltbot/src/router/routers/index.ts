// 模块路由管理
import type { AppRouteRecordRaw, AppRouteModule } from '../type';
const modules = import.meta.glob<{ default: AppRouteModule | AppRouteModule[] }>('./modules/**/*.ts',{ eager: true });
console.log(modules);

export const routeModuleList: AppRouteModule[] = [];
// 添加modules里面的路由
Object.keys(modules).forEach((key) => {
  const mod = modules[key].default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  routeModuleList.push(...modList);
});

export const InitRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Home',
  // component: newHome,
  component: () => import('@/views/welcome/index.vue'),
};

export const WelcomeRoute: AppRouteRecordRaw = {
  path: '/welcome',
  name: 'Welcome',
  component: () => import('@/views/welcome/index.vue'),
};

export const ChatRoute: AppRouteRecordRaw = {
  path: '/chat',
  name: 'Chat',
  component: () => import('@/views/chat/index.vue'),
};
export const asyncRoutes = [InitRoute,WelcomeRoute,ChatRoute, ...routeModuleList];

export const basicRoutes = asyncRoutes;
