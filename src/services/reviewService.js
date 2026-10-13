import api from './api';

export const createReview = (payload) => {
  const formData = new FormData();
  // Avis lie a une reservation (verifie) OU avis public sans reservation
  // (visiteur anonyme ou client) : un seul des deux identifiants est envoye.
  if (payload.bookingId) formData.append('bookingId', payload.bookingId);
  else formData.append('listingId', payload.listingId);
  if (payload.guestName) formData.append('guestName', payload.guestName);
  formData.append('title', payload.title);
  formData.append('recommend', payload.recommend);
  formData.append('qualityRating', payload.qualityRating);
  formData.append('responseTimeRating', payload.responseTimeRating);
  formData.append('professionalismRating', payload.professionalismRating);
  formData.append('valueRating', payload.valueRating);
  formData.append('flexibilityRating', payload.flexibilityRating);
  if (payload.comment) formData.append('comment', payload.comment);
  (payload.photos || []).forEach((file) => formData.append('photos', file));

  return api
    .post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const replyToReview = (id, reply) =>
  api.patch(`/reviews/${id}/reply`, { reply }).then((res) => res.data);

export const reportReview = (id, payload) =>
  api.post(`/reviews/${id}/report`, payload).then((res) => res.data);

export const verifyReview = (id) => api.patch(`/reviews/${id}/verify`).then((res) => res.data);
