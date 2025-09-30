import { defineStore } from "pinia";
import { useRedo } from "@/hooks/web/usePage";


interface ITagsState {
  openTags: any[],
  activeIndex: string // 激活状态
  caCheViews: (string | undefined)[]
}
export const useTagsStore = defineStore({
  id: 'app-tags',
  state: (): ITagsState => ({
    openTags: [],
    activeIndex: '',
    caCheViews: []
  }),
  getters: {},
  actions: {
    addTags(data: any) {
      for (let option of this.openTags) {
        if (option.name === data.name) {
          return
        }
      }
      if (data.name !== 'Login') {
        this.openTags.push(data)
      }
    },
    deleteTags(tagName: any) {
      let index = 0
      for (let option of this.openTags) {
        if (option.title === tagName) {
          break
        }
        index++
      }
      this.openTags.splice(index, 1)
    },
    setActiveIndex(index: any) {
      this.activeIndex = index
    },
    // 路由缓存
    // 新增路由缓存
    addCacheView(route: any) {
      if (this.caCheViews.includes(route.name)) {
        return
      }
      if(!route.meta.noCache) {
        this.caCheViews.push(route.name)
      }
    },
    // 清除路由缓存：路由系统自带的 需要手动去清除
    deleteCacheView(routeName: any) {
      for (const [i, v] of this.caCheViews.entries()) {
        if (v === routeName) {
          this.caCheViews.splice(i, 1)
          break
        }
      }
    },
    // 静态无感帅新页面
    async reFreshPage(route: any) {
      const redo = useRedo(route);
      await redo()
    }
  }
})

// 添加到store index中
export function useTagsStoreWithOut() {
  return useTagsStore(store);
}