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
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="key"></component>
          </keep-alive>
        </transition>
      </section>
    </template>
  </RouterView>
</template>

<script lang="ts">
import { useRoute } from 'vue-router'
import { computed, toRaw, unref } from 'vue';
import { useTagsStore } from "@/stores/modules/tags";
export default {
  name: 'AppMain',
  setup() {
    const router = useRoute();
    // const a = useTagsStore();
    const key = computed(() => {
      // console.log('router', router)
      return router.path;
    })
    // const cachedViews = computed(() => {
    //   return useTags.caCheViews
    // })
    const openCache = computed(() => {
      return
    })
    return {
      key,
      //cachedViews
    }
  }
}
</script>