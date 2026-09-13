import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { errorResponse, successResponse } from '@/lib/response';
import { toHabitError } from './service';

export function parsePositiveId(raw: string) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function requireUserId() {
  const { userId } = await auth();
  return userId;
}

export function habitSuccess<T>(data: T, message = '操作成功') {
  return successResponse(data, message);
}

export function habitFailure(error: unknown, context: Record<string, unknown>) {
  const known = toHabitError(error);
  if (known) {
    return NextResponse.json(
      {
        success: false,
        code: known.status,
        errorCode: known.errorCode,
        message: known.message,
        error: known.message,
        details: known.details,
        timestamp: new Date().toISOString(),
      },
      { status: known.status },
    );
  }
  console.error('习惯养成功能请求失败', { ...context, error });
  return errorResponse('习惯养成功能暂时不可用', 500);
}
