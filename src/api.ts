const base = import.meta.env.VITE_API_URL ?? '/api';

// ponytail: MSW stands in for the backend until VITE_API_URL is set (stage 9).
export const ready: Promise<unknown> = import.meta.env.VITE_API_URL
  ? Promise.resolve()
  : import('./mocks/browser').then(({ worker }) => worker.start({ onUnhandledFrame: 'bypass', quiet: true }));

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  await ready;
  const res = await fetch(base + path, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const eventsUrl = (id: string) => `${base}/projects/${id}/events`;
