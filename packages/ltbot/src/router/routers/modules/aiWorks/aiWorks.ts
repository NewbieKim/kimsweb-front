import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'

const aiWorks: AppRouteModule = {
  path: '/aiWorks',
  name: '',
  component: Layout,
  redirect: '/aiWorks',
  meta: {
    orderNo: 2000,
    title: '',
    icon: 'el-icon-collection-tag'
  },
  children: [
    {
      path: '',
      name: 'AiWorks',
      component: () => import('@/views/aiWorks/index.vue'),
      meta: {
        title: 'AI作品集',
        keepAlive: true
      }
    }
  ]
}

export default aiWorks;