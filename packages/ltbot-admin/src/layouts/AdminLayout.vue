<template>
  <tiny-container :aside-width="220" class="admin-layout">
    <template #aside>
      <tiny-tree-menu :data="menuData" @node-click="handleNodeClick">
        <template #default="{ data }">
          {{ data.label }}
        </template>
      </tiny-tree-menu>
    </template>
    <template #header>
      <div class="header-content">
        <div class="logo">电商后台</div>
        <div class="user-info">
          <span class="user-dropdown">
            <tiny-user-head type="icon" round min></tiny-user-head>
            <span class="username">Admin</span>
          </span>
        </div>
      </div>
    </template>
    <router-view />
  </tiny-container>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../store';
import {
  TinyContainer,
  TinyTreeMenu,
  TinyDropdown,
  TinyDropdownMenu,
  TinyDropdownItem,
  TinyBreadcrumb,
  TinyBreadcrumbItem,
  TinyUserHead,
} from '@opentiny/vue';

const store = useStore();
const route = useRoute();
const router = useRouter();

import { iconApp, iconExpressSearch } from '@opentiny/vue-icon';

const menuData = reactive([
  {
    id: 100,
    label: '总览',
    customIcon: iconApp(),
    path: '/dashboard',
  },
  {
    id: 200,
    label: '商品管理',
    customIcon: iconExpressSearch(),
    path: '/products',
  },
]);

const handleNodeClick = (data) => {
  router.push(data.path);
};

// 面包屑导航
const breadcrumbs = computed(() => {
  const items = [{ path: '/', name: '首页' }];
  if (route.name === 'Products') {
    items.push({ path: '/products', name: '商品管理' });
  } else if (route.name === 'AddProduct') {
    items.push(
      { path: '/products', name: '商品管理' },
      { path: '/products/add', name: '添加商品' },
    );
  } else if (route.name === 'EditProduct') {
    items.push(
      { path: '/products', name: '商品管理' },
      { path: route.path, name: '编辑商品' },
    );
  } else if (route.name === 'Statistics') {
    items.push({ path: '/statistics', name: '系统统计' });
  }
  return items;
});
</script>

<style scoped lang="less">
.admin-layout {
  height: 100vh;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  // color: #191919;
  box-sizing: border-box;
}

.header-content {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #3a97f7;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  :deep(.tiny-svg) {
    color: #fff;
    fill: #fff;
  }

  .username {
    margin-left: 8px;
    font-size: 14px;
    color: #fff;
  }
}
:deep(.tiny-dropdown__suffix-inner) {
  .tiny-svg {
    fill: #fff;
  }
}
:deep(.tiny-container__main) {
  background-color: #f5f5f5;
  padding: 15px;
}
</style>
