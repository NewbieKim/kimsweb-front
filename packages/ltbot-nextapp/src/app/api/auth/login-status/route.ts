import { getLoginStatus } from '@/lib/auth/login-attempt';
import { getClientIp } from '@/lib/auth/client-ip';
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
    if (!isValidPhone(phone)) {
      return badRequestResponse('手机号格式错误');
    }

    const status = await getLoginStatus(phone, getClientIp(request));
    return successResponse(status, '登录状态查询成功');
  } catch (error: unknown) {
    console.error('查询登录状态失败:', error);
    return errorResponse('查询登录状态失败', 500);
  }
}
