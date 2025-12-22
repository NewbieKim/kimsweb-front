import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api', // 可以根据环境变量设置基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: any) => {
    // 在发送请求之前做些什么
    // 例如：添加token
    // const token = localStorage.getItem('token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一响应格式处理
    const data = response.data;
    
    // 打印响应日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API响应:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        data: data,
      });
    }
    
    // 返回完整的响应数据（包含 success, code, message, data）
    return data;
  },
  (error) => {
    // 对响应错误做点什么
    console.error('❌ API错误:', error);
    
    // 处理不同的错误状态码
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('参数错误:', data?.message || data?.error);
          break;
        case 401:
          console.error('未授权，请先登录');
          // 可以跳转到登录页
          // window.location.href = '/login';
          break;
        case 403:
          console.error('拒绝访问，权限不足');
          break;
        case 404:
          console.error('请求地址不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error('未知错误:', status);
      }
      
      // 返回统一的错误格式
      return Promise.reject({
        success: false,
        code: status,
        message: data?.message || data?.error || '请求失败',
        error: data?.error || error.message,
      });
    }
    
    // 网络错误或其他错误
    return Promise.reject({
      success: false,
      code: 0,
      message: '网络错误，请检查网络连接',
      error: error.message,
    });
  }
);

// 封装常用的HTTP方法
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config);
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config);
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config);
  },
};

export default request;