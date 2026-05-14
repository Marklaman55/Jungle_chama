const BACKEND_URL = 'https://jungle-chama-a8op.onrender.com';
const BASE_URL = (import.meta.env.VITE_APP_BASE_URL || BACKEND_URL || '').replace(/\/+$/, '');

export const apiFetch = (path: string, options?: RequestInit): Promise<Response> => {
  const url = `${BASE_URL}${path}`;
  return fetch(url, options);
};
