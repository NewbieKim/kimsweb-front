import {
  clearLoginAttempts,
  recordLoginFailure,
} from '@/lib/auth/login-attempt';
import { getClientIp } from '@/lib/auth/client-ip';
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';
import { isValidPhone } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const ok = body.ok === true;
    if (!isValidPhone(phone)) {
      return badRequestResponse('手机号格式错误');
    }

    const ip = getClientIp(request);
    const status = ok
      ? await clearLoginAttempts(phone, ip).then(() => ({
          locked: false,
          lockRemainingSeconds: 0,
          remainingAttempts: 10,
        }))
      : await recordLoginFailure(phone, ip);

    await createOperationEvent({
      eventType: ok
        ? OPERATION_EVENT_TYPES.AUTH_LOGIN_SUCCESS
        : OPERATION_EVENT_TYPES.AUTH_LOGIN_FAILED,
      metadata: {
        phoneMasked: maskPhone(phone),
        remainingAttempts: status.remainingAttempts,
      },
    });

    return successResponse(status, ok ? '登录成功' : '登录失败');
  } catch (error: unknown) {
    console.error('记录登录尝试失败:', error);
    return errorResponse('操作失败，请稍后重试', 500);
  }
}

function maskPhone(phone: string): string {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}
