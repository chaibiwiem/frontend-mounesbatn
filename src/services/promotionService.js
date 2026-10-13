import api from './api';

export const getListingPromotions = (listingId) =>
  api.get(`/listings/${listingId}/promotions`).then((res) => res.data);

export const createPromotion = (payload) =>
  api.post('/promotions', payload).then((res) => res.data);

export const updatePromotion = (id, payload) =>
  api.patch(`/promotions/${id}`, payload).then((res) => res.data);

export const deletePromotion = (id) => api.delete(`/promotions/${id}`).then((res) => res.data);
