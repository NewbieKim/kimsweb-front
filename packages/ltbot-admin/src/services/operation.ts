import { requestApi } from './api';
import type { OperationMetrics } from '../types/admin';

export interface OperationMetricsQuery {
  startDate?: string;
  endDate?: string;
}

export async function fetchOperationMetrics(query: OperationMetricsQuery = {}) {
  return requestApi<OperationMetrics>('/api/admin/operation-metrics', {
    method: 'GET',
    query,
  });
}
