import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'

const createSpace: AppRouteModule = {
  path: '/createSpace',
  name: '',
  component: Layout,
  redirect: '/createSpace',
  meta: {
    orderNo: 2000,
    title: '',
    icon: 'el-icon-edit'
  },
  children: [
    {
      path: '',
      name: 'CreateSpace',
      component: () => import('@/views/createSpace/index.vue'),
      meta: {
        title: '创作空间',
        keepAlive: true
      }
    }
  ]
}

export default createSpace;