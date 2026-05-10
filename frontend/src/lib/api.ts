const BASE_URL = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');

export const apiFetch = (path: string, options?: RequestInit): Promise<Response> => {
  const url = BASE_URL ? `${BASE_URL}${path}` : path;
  return fetch(url, options);
};
