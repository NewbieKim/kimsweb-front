import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'

const user: AppRouteModule = {
  path: '/user',
  name: '',
  component: Layout,
  redirect: '/user',
  meta: {
    orderNo: 2000,
    title: '',
    icon: 'el-icon-user'
  },
  children: [
    {
      path: '',
      name: 'User',
      component: () => import('@/views/user/index.vue'),
      meta: {
        title: '个人介绍',
        keepAlive: true
      }
    },
  ]
}

export default user;