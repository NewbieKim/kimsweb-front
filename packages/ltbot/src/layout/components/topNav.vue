<template>
    <nav class="top-nav">
        <div class="nav-left">
            <div class="logo-box">
                <a href="">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" width="30" height="18" class="sc-CB-gsnTZi CB-fcgNFw"><path d="M21.4 22.4h21.2v-4.8H21.4z"></path><path d="M53.3 0H39.2l3.4 4.8L52.9 8c1.9.6 3.1 2.3 3.1 4.3v15.4c0 2-1.2 3.7-3.1 4.3l-10.3 3.2-3.4 4.8h14.1c6 0 10.7-4.8 10.7-10.7V10.7C64 4.7 59.2 0 53.3 0M10.7 0h14.1l-3.4 4.8L11.1 8A4.5 4.5 0 0 0 8 12.3v15.4c0 2 1.2 3.7 3.1 4.3l10.3 3.2 3.4 4.8H10.7C4.7 40 0 35.2 0 29.3V10.7C0 4.7 4.8 0 10.7 0"></path></svg>
                </a>
            </div>
            <div class="platform-title" @click="goWorkBench">工作台</div>
        </div>
        
        <div class="nav-right">
            <a class="nav-link" @click="goChat">AI助手</a>
            <a class="nav-link" @click="goBiCharts">图表统计</a>
            <a class="nav-link" @click="goBiCharts">组件集合</a>
            <a class="nav-link" @click="reFreshPage">文章博客</a>
            <a class="nav-link" @click="goUserInfoPage">个人介绍</a>
            <span class="divider"></span>
            <!-- 右边menus -->
            <div class="right-menu">
                <span
                    class="right-menu-item"
                    title="全屏"
                    @click="toggle"
                >
                <svg-icon :name="'fullScree'" />
                </span>
                <span
                    class="right-menu-item"
                    title="刷新"
                    @click="reFreshPage"
                >
                <svg-icon :name="'reset'" />
                </span>
                <span
                    class="right-menu-item"
                    title="语言"
                >
                <svg-icon :name="'lan'" />
                </span>
                <span
                    class="right-menu-item"
                    title="用户头像"
                    @click="openSysOpt"
                >
                <svg-icon :name="'user'" />
                </span>
                <span
                    class="right-menu-item"
                    title="系统配置"
                    @click="openSysOpt"
                >
                <svg-icon :name="'xiugai'" />
                </span>
                <span
                    class="right-menu-item"
                    title="退出登录"
                    @click="loginOutTab"
                >
                <svg-icon :name="'loginOut'" />
                </span>
            </div>
        </div>
    </nav>
</template>
  
<script lang="ts" setup>
  import { ref, computed, onMounted, watchEffect, watch, inject } from 'vue';
  import { useRouter, onBeforeRouteUpdate } from 'vue-router';
//   import Hamburger from '@/components/Hamburger/index.vue';
//   import { useAppStore } from '@/store/modules/app'
//   import { useUserStore } from '@/store/modules/user';
//   import { useTagsStore } from '@/store/modules/tags'
//   import { useMenusStore } from '@/store/modules/menus'

//   import { useFullscreen } from '@vueuse/core';
//   import { defineProps, defineEmits } from "vue";
//   const useApp = useAppStore();
//   const useStore = useUserStore();
//   const useTags = useTagsStore();
//   const useMenus = useMenusStore();

  //const { isFullscreen, enter, exit, toggle } = useFullscreen();
  const router = useRouter()
  const onRefresh: any = inject<Function>('reload')
  
  // 定义 emit
  const emit = defineEmits(['open-ai-sidebar'])

const goWorkBench = () => {
    router.push({ path: '/workBench' })
}
const goBiCharts = () => {
    router.push({ path: '/biCharts' })
}
// 刷新页面
const reFreshPage = () => {
    // 采用provide/inject的方式来刷新路由
    onRefresh()
    // 重定向的方式来刷新路由
    // let route = router
    // useTags.reFreshPage(route)
}
const goUserInfoPage = () => {
    router.push({ path: '/user' })
}
const goChat = () => {
    // 不再跳转路由，改为触发事件打开侧边栏
    emit('open-ai-sidebar')
}

// 全屏切换
const toggle = () => {
    // 全屏功能实现
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        }
    }
}

// 打开系统配置
const openSysOpt = () => {
    console.log('打开系统配置')
    // 这里可以添加打开系统配置的逻辑
}

// 退出登录
const loginOutTab = () => {
    console.log('退出登录')
    // 这里可以添加退出登录的逻辑
    // 例如：清除token，跳转到登录页等
}
</script>
  
<style scoped>
  .top-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 64px;
            padding: 0 24px;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }

        /* 左侧区域 */
        .nav-left {
            display: flex;
            align-items: center;
            gap: 32px;
        }
        .logo-box {
            margin-top: 5px;
        }

        /* 平台标题 */
        .platform-title {
            font-size: 18px;
            font-weight: 600;
            color: #666;
            /* 新增样式 */
            padding: 8px 16px;
            background: #f5f7fa;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            /* 过渡动画 */
            transition: all 0.3s ease;
        }
        /* 悬停效果增强 */
        .platform-title:hover {
            background: #ebedf0 !important;
            border-color: #d4d7de !important;
            cursor: pointer; /* 根据需求设置为pointer或default */
        }

        /* 搜索框样式 */
        .search-box {
            position: relative;
            width: 240px;
        }

        .search-input {
            width: 100%;
            height: 36px;
            padding: 0 12px;
            border: 1px solid #e4e7ed;
            border-radius: 18px;
            font-size: 14px;
            transition: all 0.3s;
        }

        .search-input:focus {
            outline: none;
            border-color: #409eff;
            box-shadow: 0 0 4px rgba(64, 158, 255, 0.3);
        }

        /* 右侧导航链接 */
        .nav-right {
            display: flex;
            align-items: center;
            gap: 28px;
        }

        .nav-link {
            font-size: 18px;
            color: #7f7f82;
            cursor: pointer;
            transition: color 0.3s;
            text-decoration: none;
            /* font-family: math; */
            font-weight: 600;
        }

        .nav-link:hover {
            color: #409eff;
        }

        /* 分割线 */
        .divider {
            height: 16px;
            width: 1px;
            background: #dcdfe6;
            margin: 0 12px;
        }
        .right-menu {
            right: 10px;
            cursor: pointer;
            height:40px;
            line-height: 40px;
            display: flex;
            .right-menu-item {
                display: inline-block;
                padding: 0 8px;
                height: 100%;
                font-size: 18px;
                color: #5a5e66;
                vertical-align: text-bottom;
            }
        }
</style>