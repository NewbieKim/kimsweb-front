/**
 * 统一API响应类型定义
 */

// 响应状态码枚举
export enum ResponseCode {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

// 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean;           // 是否成功
  code: ResponseCode;         // 状态码
  message: string;            // 提示信息
  data?: T;                   // 响应数据
  error?: string;             // 错误信息
  timestamp?: string;         // 时间戳
}

// 分页数据
export interface PaginatedData<T> {
  list: T[];                  // 数据列表
  total: number;              // 总数
  page: number;               // 当前页
  pageSize: number;           // 每页数量
  totalPages: number;         // 总页数
}

// 用户数据类型
export interface User {
  id: number;
  name: string;
  email: string;
  age: number | null;
  createdAt: string;
  updatedAt: string;
  posts?: Post[];
}

// 文章数据类型
export interface Post {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}




