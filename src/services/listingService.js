import api from './api';

export const searchListings = (params) => api.get('/listings', { params }).then((res) => res.data);

// Prestataires en avant pour plusieurs categories en une seule requete (au
// lieu d'un searchListings par categorie affichee) - voir PrestatairesLanding.
export const getListingsByCategories = (categorySlugs, limit = 8) =>
  api
    .get('/listings/by-categories', { params: { categories: categorySlugs.join(','), limit } })
    .then((res) => res.data);

export const getListing = (id) => api.get(`/listings/${id}`).then((res) => res.data);

export const getListingBySlug = (categorySlug, listingSlug) =>
  api.get(`/listings/slug/${categorySlug}/${listingSlug}`).then((res) => res.data);

export const getSimilarListings = (id) =>
  api.get(`/listings/${id}/similar`).then((res) => res.data);

export const getCategories = () => api.get('/categories').then((res) => res.data);

// Sous-categories supplementaires de la fiche (limite : plan d'abonnement).
export const updateMyCategories = (categoryIds) =>
  api.put('/listings/me/categories', { categoryIds }).then((res) => res.data);

export const getCities = () => api.get('/cities').then((res) => res.data);

// Villes actives avec au moins un prestataire actif + leur nombre de fiches -
// pour la section "Professionnels par zone" de la page d'accueil.
export const getCitiesWithCounts = () => api.get('/cities/with-counts').then((res) => res.data);

export const getMyListing = () => api.get('/listings/me').then((res) => res.data);

export const updateMyListing = (payload) =>
  api.patch('/listings/me', payload).then((res) => res.data);

export const uploadListingImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api
    .post('/listings/me/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const deleteListingImage = (imageId) =>
  api.delete(`/images/${imageId}`).then((res) => res.data);

export const setPrimaryListingImage = (imageId) =>
  api.patch(`/images/${imageId}/primary`).then((res) => res.data);

export const reorderListingImages = (order) =>
  api.patch('/listings/me/images/reorder', { order }).then((res) => res.data);

export const uploadListingLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api
    .post('/listings/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const deleteListingLogo = () => api.delete('/listings/me/logo').then((res) => res.data);

// Config email prestataire (M5, onglet "Email SMTP") : SMTP/Resend propre au
// prestataire pour l'envoi de factures/contrats a ses clients, en repli sur
// le SMTP central de la plateforme si non configure.
export const getMyEmailSettings = () => api.get('/listings/me/email-settings').then((res) => res.data);

export const updateMyEmailSettings = (payload) =>
  api.patch('/listings/me/email-settings', payload).then((res) => res.data);

export const sendMyTestEmail = (to) =>
  api.post('/listings/me/email-settings/test', { to }).then((res) => res.data);

export const getListingVideos = (listingId) =>
  api.get(`/listings/${listingId}/videos`).then((res) => res.data);

// Ajout par lien externe (YouTube/Vimeo) — aucun stockage cote serveur pour
// la video ; vignette personnalisee optionnelle (sinon derivee automatiquement
// pour YouTube, ou aucune pour Vimeo).
export const addListingVideoLink = (url, title, thumbnailFile) => {
  const formData = new FormData();
  formData.append('url', url);
  if (title) formData.append('title', title);
  if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
  return api
    .post('/listings/me/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const uploadListingVideoFile = (file, title, thumbnailFile) => {
  const formData = new FormData();
  formData.append('video', file);
  if (title) formData.append('title', title);
  if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
  return api
    .post('/listings/me/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

// Ajoute/remplace la vignette (et/ou le titre) d'une video deja existante —
// pratique pour donner une belle image de couverture a une video ajoutee
// sans vignette (lien Vimeo, ou upload).
export const updateListingVideo = (videoId, { title, thumbnailFile } = {}) => {
  const formData = new FormData();
  if (title !== undefined) formData.append('title', title);
  if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
  return api
    .patch(`/videos/${videoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const deleteListingVideo = (videoId) =>
  api.delete(`/videos/${videoId}`).then((res) => res.data);

export const getAvailability = (listingId) =>
  api.get(`/listings/${listingId}/availability`).then((res) => res.data);

export const upsertAvailability = (payload) =>
  api.post('/availability', payload).then((res) => res.data);

export const deleteAvailability = (id) => api.delete(`/availability/${id}`).then((res) => res.data);
