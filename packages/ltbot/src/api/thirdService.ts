import { httpPost } from '@/utils/http'
const LOCALURL = 'http://120.79.113.248:3000/'
export const thirdServiceApi = {
  download: LOCALURL + 'thirdService/download',
  uploadBySingle: LOCALURL + 'thirdService/uploadSingle'
}

export const download = (params = {}) => {
  return httpPost({ url: thirdServiceApi.download, params })
}
export const uploadBySingle: any = (params) => {
  return httpPost({ url: thirdServiceApi.uploadBySingle, params })
}

export default thirdServiceApi