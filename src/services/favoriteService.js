import api from './api';

export const getMyFavorites = () => api.get('/favorites/me').then((res) => res.data);

export const addFavorite = (listingId) =>
  api.post('/favorites', { listingId }).then((res) => res.data);

export const removeFavorite = (listingId) =>
  api.delete(`/favorites/${listingId}`).then((res) => res.data);
