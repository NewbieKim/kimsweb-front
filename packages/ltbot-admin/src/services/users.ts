import { requestApi } from './api';
import type {
  AdminUserDetailResponse,
  AdminUserListResponse,
} from '../types/admin';

export interface AdminUsersQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  registerStartDate?: string;
  registerEndDate?: string;
}

export async function fetchAdminUsers(query: AdminUsersQuery) {
  const apiQuery: Record<string, string | number | boolean | null | undefined> = {
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    registerStartDate: query.registerStartDate,
    registerEndDate: query.registerEndDate,
  };
  return requestApi<AdminUserListResponse>('/api/admin/users', {
    method: 'GET',
    query: apiQuery,
  });
}

export async function fetchAdminUserDetail(userId: string) {
  return requestApi<AdminUserDetailResponse>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
}
