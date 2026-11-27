const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    ...options,
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => null);
    let errMsg = `HTTP ${resp.status}`;
    if (errData) {
      if (typeof errData.detail === 'string') {
        errMsg = errData.detail;
      } else if (Array.isArray(errData.detail)) {
        errMsg = errData.detail
          .map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d)))
          .join('; ');
      } else if (typeof errData.message === 'string') {
        errMsg = errData.message;
      } else if (typeof errData.error === 'string') {
        errMsg = errData.error;
      } else if (typeof errData === 'string') {
        errMsg = errData;
      }
    }
    throw new Error(errMsg);
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
  chat: (query: string, top_k = 5, history?: { role: string; content: string }[]) =>
    apiFetch<any>('/chat', { method: 'POST', body: JSON.stringify({ query, top_k, history }) }),
  knowledgeSources: () => apiFetch<any>('/knowledge/sources'),
};
