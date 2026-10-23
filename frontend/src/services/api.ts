const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  health: () => apiFetch<any>('/health'),
  modelInfo: () => apiFetch<any>('/model/info'),
  modelMetrics: () => apiFetch<any>('/model/metrics'),
  predict: (data: any) =>
    apiFetch<any>('/predict', { method: 'POST', body: JSON.stringify(data) }),
  explain: (data: any) =>
    apiFetch<any>('/explain', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (query: string, top_k = 5) =>
    apiFetch<any>('/rag/retrieve', {
      method: 'POST',
      body: JSON.stringify({ query, top_k }),
    }),
  chat: (query: string, top_k = 5) =>
    apiFetch<any>('/chat', { method: 'POST', body: JSON.stringify({ query, top_k }) }),
  knowledgeSources: () => apiFetch<any>('/knowledge/sources'),
};
