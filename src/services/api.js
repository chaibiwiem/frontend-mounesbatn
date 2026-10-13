import axios from 'axios';

const TOKEN_KEY = 'farahbooking_token';
const REFRESH_TOKEN_KEY = 'farahbooking_refresh_token';
const USER_KEY = 'farahbooking_user';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSessionAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

// Le token d'acces expire au bout d'1h (CLAUDE.md - securite). Sur un 401,
// on tente un renouvellement silencieux via le refresh token avant de
// rejouer la requete d'origine ; sinon la session est vraiment terminee.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        axios.post('/api/auth/refresh-token', { refreshToken }).finally(() => {
          refreshPromise = null;
        });
      const { data } = await refreshPromise;

      localStorage.setItem(TOKEN_KEY, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }
  }
);

export default api;
