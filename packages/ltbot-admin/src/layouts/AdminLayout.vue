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
        <div class="logo">运营后台</div>
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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  TinyContainer,
  TinyTreeMenu,
  TinyUserHead,
} from '@opentiny/vue';

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
  {
    id: 300,
    label: '用户数据管理',
    customIcon: iconExpressSearch(),
    path: '/user-data-manage',
  },
]);

const handleNodeClick = (data: { path?: string }) => {
  if (!data.path) {
    return;
  }
  router.push(data.path);
};
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
