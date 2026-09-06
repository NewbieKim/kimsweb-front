/**
 * 统一响应处理工具函数
 */
import { NextResponse } from 'next/server'
import { ApiResponse, ResponseCode } from '@/types/response'

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  message: string = '操作成功',
  code: ResponseCode = ResponseCode.SUCCESS
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  })
}

/**
 * 错误响应
 */
export function errorResponse(
  message: string = '操作失败',
  code: ResponseCode = ResponseCode.INTERNAL_ERROR,
  error?: unknown
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : message;
  return NextResponse.json(
    {
      success: false,
      code,
      message,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    },
    { status: code }
  )
}

/**
 * 创建成功响应
 */
export function createdResponse<T>(
  data: T,
  message: string = '创建成功'
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, ResponseCode.CREATED)
}

/**
 * 参数错误响应
 */
export function badRequestResponse(
  message: string = '参数错误'
): NextResponse<ApiResponse> {
  return errorResponse(message, ResponseCode.BAD_REQUEST)
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(
  message: string = '未授权'
): NextResponse<ApiResponse> {
  return errorResponse(message, ResponseCode.UNAUTHORIZED)
}

/**
 * 禁止访问响应
 */
export function forbiddenResponse(
  message: string = '禁止访问'
): NextResponse<ApiResponse> {
  return errorResponse(message, ResponseCode.FORBIDDEN)
}

/**
 * 未找到响应
 */
export function notFoundResponse(
  message: string = '资源未找到'
): NextResponse<ApiResponse> {
  return errorResponse(message, ResponseCode.NOT_FOUND)
}

export function validationErrorResponse(
  message: string,
  details: { errorCode: string; field: string; category: string }
): NextResponse<ApiResponse & typeof details> {
  return NextResponse.json(
    {
      success: false,
      code: ResponseCode.BAD_REQUEST,
      message,
      error: message,
      ...details,
      timestamp: new Date().toISOString(),
    },
    { status: ResponseCode.BAD_REQUEST }
  )
}
