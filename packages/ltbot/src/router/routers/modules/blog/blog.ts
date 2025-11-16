import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'

const blog: AppRouteModule = {
  path: '/blog',
  name: '',
  component: Layout,
  redirect: '/blog',
  meta: {
    orderNo: 2000,
    title: '',
    icon: 'el-icon-document'
  },
  children: [
    {
      path: '',
      name: 'Blog',
      component: () => import('@/views/blog/index.vue'),
      meta: {
        title: '博客',
        keepAlive: true
      }
    },
  ]
}

export default blog;