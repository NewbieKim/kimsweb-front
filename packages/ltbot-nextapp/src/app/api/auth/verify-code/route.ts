import { createVerifyToken } from '@/lib/auth/verify-token';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';
import {
  isValidPhone,
  isValidSmsScene,
  markSmsVerified,
  SmsError,
  verifySmsCode,
} from '@/lib/sms';
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const scene = typeof body.scene === 'string' ? body.scene.trim() : '';

    if (!isValidPhone(phone) || !isValidSmsScene(scene) || !code) {
      return badRequestResponse('参数错误');
    }

    await verifySmsCode(phone, code, scene);
    const smsLogId = await markSmsVerified(phone, scene);
    const token = createVerifyToken(phone, scene, smsLogId);

    return successResponse(
      { verified: true, token },
      '验证码核验成功'
    );
  } catch (error: unknown) {
    if (error instanceof SmsError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('核验验证码失败:', error);
    return errorResponse('验证码核验失败，请稍后重试', 500);
  }
}
