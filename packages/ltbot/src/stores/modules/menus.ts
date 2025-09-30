import { defineStore } from 'pinia'
import { store } from '../../store'
import { LoginRoute } from '../../router/routers';
// import { menu } from '../../router/menu';
import axios from 'axios';
import { menusApi, getMenusList } from '../../api/menus'
import { basicRoutes, routeModuleList } from '@/router/routers';
import { Base } from "@/utils/base";
interface IMenusState {
  userInfo: string;
  userId: string,
  token?: string;
}

export const useMenusStore = defineStore({
  id: 'app-menus',
  state: (): IMenusState => ({
    userInfo: 'kkk',
    userId: '123',
    token: '123kkk20211102232333'
  }),
  // @ts-ignore
  // state: { count: 1 },
  getters: {

  },
  actions: {
    getMenus1() {
      const base = new Base()
      // let routesData = base.util.shallowCopy(routeModuleList);
      let routesData = JSON.parse(JSON.stringify(routeModuleList))
      // routesData = routesData.filter((item: any) => {
      //   return !item.path.includes(':/')
      // })
      return routesData;
    },
    async getMenus() {
      console.log('local menu', routeModuleList)
      const params = {
        userId: '2021102601',
        userName: 'chsp'
      }
      // 调用接口
      // const data: any = await axios.post(menusApi.getMenus, params)
      const data: any = await getMenusList(params)
      // // this.state.menus = data.data.data;
      return data
    }
  }
})

// 添加到store index中
export function useMenusStoreWithOut() {
  return useMenusStore(store);
}