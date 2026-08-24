<template>
  <RouterView>
    <template #default="{ Component }">
      <section class="app-main">
        <transition
          name="fade-transform"
          mode="out-in"
        >
          <!-- <keep-alive>
            <router-view :key="key" />
          </keep-alive> -->
          <keep-alive>
            <component :is="Component" :key="key"></component>
          </keep-alive>
        </transition>
      </section>
    </template>
  </RouterView>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue';

const router = useRoute();
const key = computed(() => {
  return router.path;
})
</script>

<style scoped>
.app-main {
  width: 100%;
  min-height: calc(100vh - 64px);
  text-align: left;
}
</style>
