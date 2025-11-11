<template>
  <div class="app-wrapper">
    <!-- <SliderBar class="sidebar-container" /> -->
    <div class="main-container" id="mainContainer">
      <topNav @open-ai-sidebar="handleOpenAISidebar" />
      <mainContain />
      <!-- <el-scrollbar
        style="margin-top: 30px;"
        class="main-scrollbar-wrapper"
        wrap-class="main-scrollbar-wrapper"
      >
        <mainContain />
      </el-scrollbar> -->
    </div>
    <el-backtop />
    
    <!-- AI助手侧边栏 -->
    <AISidebar ref="aiSidebarRef" v-model="showAISidebar" />
  </div>
</template>

<script lang="ts">
import mainContain from './components/mainContain.vue'
import topNav from "./components/topNav.vue";
import AISidebar from "@/components/AISidebar.vue";
import { reactive, ref, unref, defineComponent } from 'vue'
export default defineComponent ({
  name: 'Layout',
  components: { 
    mainContain,
    topNav,
    AISidebar
  },
  setup () {
    const showAISidebar = ref(false)
    const aiSidebarRef = ref()
    
    const handleOpenAISidebar = () => {
      showAISidebar.value = true
    }
    
    return {
      showAISidebar,
      aiSidebarRef,
      handleOpenAISidebar
    }
  }
})
</script>

<style scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}
.main-container {
  height: 100%;
  transition: margin-left .28s;
  position: relative;
  background: #f6f7f9;
  padding-top: 40px;
}
.sidebar-container {
  transition: width 0.28s;
  width: 205px !important;
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}
</style>