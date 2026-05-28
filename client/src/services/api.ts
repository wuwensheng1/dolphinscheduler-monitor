const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data as T;
}

export interface Environment {
  id: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  db_type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const envApi = {
  list: () => request<Environment[]>('/environments'),
  get: (id: string) => request<Environment>(`/environments/${id}`),
  create: (data: Partial<Environment>) =>
    request<{ id: string }>('/environments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Environment>) =>
    request<void>(`/environments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/environments/${id}`, { method: 'DELETE' }),
  test: (id: string) =>
    request<{ message: string }>(`/environments/${id}/test`, { method: 'POST' }),
};

export interface Indicator {
  id: string;
  env_id: string;
  name: string;
  description: string;
  sql_text: string;
  result_type: string;
  min_value: number | null;
  max_value: number | null;
  min_sql: string | null;
  max_sql: string | null;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface IndicatorEvaluation {
  id: string;
  name: string;
  description: string;
  actualValue: number | null;
  minBound: number | null;
  maxBound: number | null;
  status: 'pass' | 'fail' | 'unknown';
  score: number;
  weight: number;
  error?: string;
}

export interface EvaluationResult {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  evaluations: IndicatorEvaluation[];
  evaluatedAt: string;
}

export const indicatorApi = {
  list: (envId: string) => request<Indicator[]>(`/indicators/env/${envId}`),
  create: (data: Partial<Indicator>) =>
    request<{ id: string }>('/indicators', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Indicator>) =>
    request<void>(`/indicators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/indicators/${id}`, { method: 'DELETE' }),
  evaluate: (envId: string) =>
    request<EvaluationResult>(`/indicators/evaluate/${envId}`, { method: 'POST' }),
};

export const projectApi = {
  list: (envId: string) => request<any[]>(`/projects/list/${envId}`),
  overview: (envId: string, params?: { startDate?: string; endDate?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any>(`/projects/overview/${envId}?${query.toString()}`);
  },
  taskStats: (envId: string, params?: { startDate?: string; endDate?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/projects/task-stats/${envId}?${query.toString()}`);
  },
  taskTrend: (envId: string, params?: { startDate?: string; endDate?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/projects/task-trend/${envId}?${query.toString()}`);
  },
  timeline: (envId: string, params: { startDate?: string; endDate?: string; projectId: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    query.set('projectId', params.projectId);
    return request<any[]>(`/projects/timeline/${envId}?${query.toString()}`);
  },
  processList: (envId: string, params: { startDate?: string; endDate?: string; projectId: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    query.set('projectId', params.projectId);
    return request<any[]>(`/projects/process-list/${envId}?${query.toString()}`);
  },
  processDetail: (envId: string, params: { startDate?: string; endDate?: string; processCode: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    query.set('processCode', params.processCode);
    return request<{ summary: any; tasks: any[] }>(`/projects/process-detail/${envId}?${query.toString()}`);
  },
};

export const dashboardApi = {
  hourlyDistribution: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/dashboard/hourly-distribution/${envId}?${query.toString()}`);
  },
  workerDistribution: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/dashboard/worker-distribution/${envId}?${query.toString()}`);
  },
  hostDistribution: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/dashboard/host-distribution/${envId}?${query.toString()}`);
  },
  taskTypeDistribution: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/dashboard/task-type-distribution/${envId}?${query.toString()}`);
  },
  durationStats: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/dashboard/duration-stats/${envId}?${query.toString()}`);
  },
  failureAnalysis: (envId: string, params?: { startDate?: string; endDate?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.limit) query.set('limit', String(params.limit));
    return request<any[]>(`/dashboard/failure-analysis/${envId}?${query.toString()}`);
  },
  dashboard: (envId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any>(`/dashboard/dashboard/${envId}?${query.toString()}`);
  },
  failureTrend: (envId: string, params?: { startDate?: string; endDate?: string; level?: string; dimension?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.level) query.set('level', params.level);
    if (params?.dimension) query.set('dimension', params.dimension);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/dashboard/failure-trend/${envId}?${query.toString()}`);
  },
  consecutiveFailures: (envId: string, params?: { startDate?: string; endDate?: string; minConsecutive?: number; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.minConsecutive) query.set('minConsecutive', String(params.minConsecutive));
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/dashboard/consecutive-failures/${envId}?${query.toString()}`);
  },
  workerLoadTrend: (envId: string, params?: { startDate?: string; endDate?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/dashboard/worker-load-trend/${envId}?${query.toString()}`);
  },
  hostConcurrentTrend: (envId: string, params?: { startDate?: string; endDate?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<any[]>(`/dashboard/host-concurrent-trend/${envId}?${query.toString()}`);
  },
};
