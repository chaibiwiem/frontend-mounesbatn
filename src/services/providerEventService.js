import api from './api';

// "Mes evenements" (M5) : evenements organises PAR le prestataire (journee
// portes ouvertes, show cooking...) pour montrer ses services en action -
// ouvert a tous les plans, aucune restriction. A ne pas confondre avec les
// "types d'evenements" du client (mariage...), purement editoriaux (M3).
const buildFormData = (payload, { keepEmptyStrings = false } = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'image') {
      if (value) formData.append('image', value);
    } else if (value !== undefined && value !== null && (keepEmptyStrings || value !== '')) {
      formData.append(key, value);
    }
  });
  return formData;
};

export const getListingEvents = (listingId) =>
  api.get(`/listings/${listingId}/events`).then((res) => res.data);

export const getPublicListingEvents = (listingId) =>
  api.get(`/listings/${listingId}/events/public`).then((res) => res.data);

// Demandes d'interet ("Je suis interesse(e)") liees a un evenement - liste
// dediee, distincte de "Demandes de devis" (voir leadController.getListingEventLeads).
export const getListingEventLeads = (listingId) =>
  api.get(`/listings/${listingId}/events/leads`).then((res) => res.data);

export const createEvent = (listingId, payload) =>
  api
    .post(`/listings/${listingId}/events`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const updateEvent = (eventId, payload) =>
  api
    .patch(`/events/${eventId}`, buildFormData(payload, { keepEmptyStrings: true }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const publishEvent = (eventId, isPublished) =>
  api.patch(`/events/${eventId}/publish`, { isPublished }).then((res) => res.data);

export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`).then((res) => res.data);
