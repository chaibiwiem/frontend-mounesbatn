import axios from 'axios';
import { compressFormDataImages } from '../utils/compressImage';

const TOKEN_KEY = 'farahbooking_token';
const REFRESH_TOKEN_KEY = 'farahbooking_refresh_token';
const USER_KEY = 'farahbooking_user';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Uploads : photos compressees avant envoi (limite de 4,5 Mo par requete
  // sur Vercel), voir utils/compressImage.js.
  if (config.data instanceof FormData) {
    config.data = await compressFormDataImages(config.data);
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

    // 413 renvoye par Vercel lui-meme (corps > 4,5 Mo) : pas de JSON
    // { message }, les ecrans afficheraient un "Echec" generique.
    if (error.response?.status === 413) {
      error.response.data = {
        message: 'Fichier trop volumineux (4,5 Mo maximum par envoi). Réduisez sa taille ou envoyez-le seul.',
      };
      return Promise.reject(error);
    }

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
