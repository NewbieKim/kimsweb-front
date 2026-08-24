import type { AppRouteModule } from '../../../type'
import Layout from '@/layout/index.vue'

const skillKnowledgeBase: AppRouteModule = {
  path: '/skillKnowledgeBase',
  name: 'SkillKnowledgeBaseLayout',
  component: Layout,
  redirect: '/skillKnowledgeBase',
  meta: {
    orderNo: 1500,
    title: '技能知识库',
    icon: 'el-icon-document'
  },
  children: [
    {
      path: '',
      name: 'SkillKnowledgeBase',
      component: () => import('@/views/skillKnowledgeBase/index.vue'),
      meta: {
        title: '技能知识库',
        keepAlive: false
      }
    }
  ]
}

export default skillKnowledgeBase
