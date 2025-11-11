import axios from "axios";
import { useUserStore } from '@/store/modules/user';

// 环境切换
if (process.env.NODE_ENV === 'development') {
  // axios.defaults.baseURL = '/proxyApi'
} else if (process.env.NODE_ENV === 'production') {
  // axios.defaults.baseURL = 'http://prod.xxx.com'
}
// 创建一个axios的实例
const service = axios.create({
  baseURL: 'http://localhost:3000/',
  timeout: 5000
})
// 请求拦截器
axios.interceptors.request.use(
  config => {
    let useStore = useUserStore()
    if (useStore.token) {
      config.headers['Authorization'] = `Bearer ` + useStore.token
      // token && (config.headers.Authorization  = token)
    }
    // node后端默认接受的{}对象
    // 上传formData格式
    if (config.url === 'http://localhost:3000/thirdService/uploadSingle') {
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
    config.headers['']
    console.log(config, axios.defaults)
    return config
  },
  error => {
    return Promise.error(error)
  }
)

// axios.defaults.timeout = 10000
// axios.defaults.headers.post['Authorization'] = 'Authorization'
// 不经过请求拦截器 无效！
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

// 响应拦截器
axios.interceptors.response.use(response => {
  if(response.status === 200) {
    if (response.data.code === 510) {}
    else {
      return Promise.resolve(response)
    }
  }
  error => {
    if (error && error.response) {
      switch (error.response.status) {
      case 400:
        error.message = '请求错误'
        break
      case 403:
        error.message = '签名已过期'
        // UserModule.ResetToken()
        setTimeout(() => {
          location.reload() // To prevent bugs from vue-router
        }, 1000)
        break
      case 404:
        error.message = `请求地址出错: ${error.response.config.url}`
        break
      case 500:
        error.message = '服务器内部错误'
        break
      default:
      }
    }
    return Promise.reject(error)
  }
})

// post请求
export function httpPost({ url, data = {}, params = {}}) {
  return new Promise((resolve, reject) => {
    axios.post(url, params).then((res) => {
      resolve(res.data)
    }).catch((error) => {
      reject(error)
    })
    // axios({
    //   url,
    //   method: 'post',
    //   // transformRequest: [function (data) {
    //   //   let ret = ''
    //   //   for (let it in data) {
    //   //     ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
    //   //   }
    //   //   return ret
    //   // }],
    //   // 发送的数据
    //   data,
    //   // url参数
    //   params
    // }).then(res => {
    //   resolve(res.data)
    // })
  })
}
