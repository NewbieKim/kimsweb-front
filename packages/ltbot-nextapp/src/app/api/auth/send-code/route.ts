import { getClientIp } from '@/lib/auth/client-ip';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';
import {
  isValidPhone,
  isValidSmsScene,
  sendSmsCode,
  SmsError,
} from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const scene = typeof body.scene === 'string' ? body.scene.trim() : '';

    if (!isValidPhone(phone) || !isValidSmsScene(scene)) {
      return badRequestResponse('参数错误');
    }

    const result = await sendSmsCode(phone, scene, getClientIp(request));
    return successResponse(
      { expireInSeconds: result.expireInSeconds },
      '验证码已发送'
    );
  } catch (error: unknown) {
    if (error instanceof SmsError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('发送验证码失败:', error);
    return errorResponse('验证码发送失败，请稍后重试', 500);
  }
}
