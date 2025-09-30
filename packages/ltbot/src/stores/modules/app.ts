import { defineStore } from 'pinia'
import { store } from '../../store'
import { setSliderBarStatus, getSliderBarStatus  } from "@/utils/cookies";

// 
interface appState {
  sliderBar: object;
}

export const useAppStore = defineStore({
  id: 'app',
  state: (): MenusState => ({
    sliderBar: {
      opened: getSliderBarStatus() === 'opened' ? true : false,
      withoutAnimation: false
    }
  }),
  // @ts-ignore
  // state: { count: 1 },
  getters: {
    //
  },
  actions: {
    /**
     * TRIGGER_BAR
     */
    TRIGGER_BAR(withoutAnimation: any) {
      this.sliderBar.opened = !this.sliderBar.opened
      this.sliderBar.withoutAnimation = withoutAnimation
      if (this.sliderBar.opened) {
        setSliderBarStatus('opened')
      } else {
        setSliderBarStatus('closed')
      }
    }
  }
})

// 添加到store index中
export function useAppStoreWithOut() {
  return useAppStore(store);
}