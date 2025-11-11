import { httpPost } from '@/utils/http'
const LOCALURL = 'http://120.79.113.248:3000/'
export const menusApi = {
  getMenus: LOCALURL + 'menus/getMenus'
}

export const getMenusList = (params = {}) => {
  return httpPost({ url: menusApi.getMenus, params })
}

export default menusApi