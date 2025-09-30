import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'
// roleManage路由
const workbench: AppRouteModule = {
  path: '/',
  name: '',
  component: Layout,
  // redirect: '/system/rolesManage',
  meta: {
    orderNo: 1000,
    title: '',
    icon: 'el-icon-s-home'
  },
  children: [
    {
      path: 'workbench',
      name: 'Workbench',
      component: () => import('@/views/workbench/index.vue'),
      meta: {
        title: '工作台',
        keepAlive: true
      }
    },
  ]
}
export default workbench;