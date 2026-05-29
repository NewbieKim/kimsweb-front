import { unauthorizedResponse } from '@/lib/response';

export function ensureAdminAuthorized(request: Request) {
  const requiredToken = (process.env.ADMIN_API_TOKEN || '').trim();
  if (!requiredToken) {
    return null;
  }

  const authHeader = request.headers.get('authorization') || '';
  const tokenFromHeader = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const tokenFromCustomHeader = (request.headers.get('x-admin-token') || '').trim();
  const token = tokenFromHeader || tokenFromCustomHeader;

  if (token !== requiredToken) {
    return unauthorizedResponse('管理员鉴权失败');
  }

  return null;
}
