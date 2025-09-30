// import type { AppRouteModule } from '../../../type'
// import component from '*.vue'
// import Layout from '@/layout/index.vue'
// // roleManage路由
// const system: AppRouteModule = {
//   path: '/system',
//   name: 'System',
//   component: Layout,
//   redirect: '/system/rolesManage',
//   meta: {
//     orderNo: 1000,
//     title: '系统管理',
//     icon: 'el-icon-setting'
//   },
//   children: [
//     {
//       path: 'rolesManage',
//       name: 'RolesManage',
//       component: () => import('@/views/system/rolesManage/index.vue'),
//       meta: {
//         title: '角色管理',
//         keepAlive: true
//       }
//     },
//     {
//       path: 'rolesDetails/:userId',
//       name: 'RolesDetails',
//       component: () => import('@/views/system/rolesManage/details.vue'),
//       // props: { default: true },
//       meta: {
//         title: '角色详情',
//         keepAlive: true
//       }
//     }
//   ]
// }
// export default system;