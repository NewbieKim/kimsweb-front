/*
  封装request请求
  author：kim-jiang
*/
import axios from 'axios'
import { useUserStore } from '@/store/modules/user';
// 创建一个axios的实例
const service = axios.create({
  baseURL: 'http://localhost:3000/',
  timeout: 5000
})
// 请求别名
const AJAXDOSUFFIX = 'myblogAjax'
const LOCALURL = 'http://localhost:3000/'

// 添加请求的拦截器
service.interceptors.request.use((config: any) => {
  let useStore = useUserStore()
  // 发送请求前的处理
  // 设置token
  config.headers['X-Token'] = useStore.token;
  config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  return config
}, (error:any) => {
  return Promise.reject(error)
})

// 添加响应拦截器
service.interceptors.response.use((response:any) => {
  if (response.state !== 200 ) {
    return Promise.reject(response.message || 'error')
  }
  return response
}, (error:any) => {
  return Promise.reject(error)
})

/*
  * 封装post请求
  * @params url
  * @params data 请求数据
  * @params type 类型
  * @return { Promise }
*/
export function httpPost(funcid:number, data: any, type?:number ) {
  data.funcid = funcid
  data.type = type
  let res: any = {}
  // 请求数据处理
  for (let prop in data) {
    if (data.hasOwnProperty(prop)) {
      res[prop] = data[prop]
      if (typeof (data[prop]) === 'number') {
        res[prop] = data[prop].toString()
      }
      if (typeof (data[prop]) === 'string') {
        res[prop] = data[prop].replace('\\', '')
      }
    }
  }
  return service.request({
    method: 'post',
    data: res
  })
}

export default service

