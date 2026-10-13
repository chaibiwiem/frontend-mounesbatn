import api from './api';

export const getPendingProviders = () =>
  api.get('/admin/providers/pending').then((res) => res.data);

export const getAllProviders = (params) =>
  api.get('/admin/providers', { params }).then((res) => res.data);

// Statistiques de reservations par prestataire (M10) : leads (fiables, generes
// par la plateforme) vs bookings (declaratifs, saisis par le prestataire).
export const getProviderStats = (id, params) =>
  api.get(`/admin/providers/${id}/stats`, { params }).then((res) => res.data);

export const getProvidersStats = (params) =>
  api.get('/admin/providers/stats', { params }).then((res) => res.data);

export const reviewProvider = (listingId, payload) =>
  api.patch(`/admin/providers/${listingId}/review`, payload).then((res) => res.data);

// Onboarding assiste : cree le compte + la fiche a la place d'un prestataire.
export const createProvider = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'photos' && key !== 'cinDocument' && value !== '' && value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  (payload.photos || []).forEach((file) => formData.append('photos', file));
  if (payload.cinDocument) formData.append('cinDocument', payload.cinDocument);

  return api
    .post('/admin/providers', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const suspendListing = (id) =>
  api.patch(`/admin/listings/${id}/suspend`).then((res) => res.data);

export const reactivateListing = (id) =>
  api.patch(`/admin/listings/${id}/reactivate`).then((res) => res.data);

// Gestion du cycle de vie d'une fiche par l'admin (M10).
export const updateProvider = (id, payload) =>
  api.patch(`/admin/providers/${id}`, payload).then((res) => res.data);

export const updateProviderStatus = (id, payload) =>
  api.patch(`/admin/providers/${id}/status`, payload).then((res) => res.data);

// Carte CIN du gerant : jamais d'URL publique - recuperee en blob via la
// route admin authentifiee, affichee via une URL objet temporaire.
export const getProviderCin = (id) =>
  api.get(`/admin/providers/${id}/cin`, { responseType: 'blob' }).then((res) => res.data);

export const uploadProviderCin = (id, file) => {
  const formData = new FormData();
  formData.append('cinDocument', file);
  return api
    .post(`/admin/providers/${id}/cin`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const deleteProviderCin = (id) => api.delete(`/admin/providers/${id}/cin`).then((res) => res.data);

export const resetProviderPassword = (id) =>
  api.post(`/admin/providers/${id}/reset-password`).then((res) => res.data);

export const softDeleteProvider = (id) =>
  api.delete(`/admin/providers/${id}`).then((res) => res.data);

export const restoreProvider = (id) =>
  api.post(`/admin/providers/${id}/restore`).then((res) => res.data);

export const getForceDeletePreview = (id) =>
  api.get(`/admin/providers/${id}/force-preview`).then((res) => res.data);

export const forceDeleteProvider = (id, { confirmTitle, deleteOwnerAccount }) =>
  api
    .delete(`/admin/providers/${id}/force`, { data: { confirmTitle, deleteOwnerAccount } })
    .then((res) => res.data);

export const getDeletedProviders = () =>
  api.get('/admin/providers/deleted').then((res) => res.data);

// Gestion manuelle complete de l'abonnement (US-A05) : plan, facturation,
// statut, dates, montant paye, reference de reglement, notes internes.
export const updateProviderSubscription = (id, payload) =>
  api.patch(`/admin/providers/${id}/subscription`, payload).then((res) => res.data);

export const getDashboardStats = (params) =>
  api.get('/admin/dashboard', { params }).then((res) => res.data);

export const getDisputes = (params) => api.get('/admin/disputes', { params }).then((res) => res.data);

export const getDispute = (id) => api.get(`/admin/disputes/${id}`).then((res) => res.data);

export const updateDispute = (id, payload) =>
  api.patch(`/admin/disputes/${id}`, payload).then((res) => res.data);

export const getReportedReviews = () =>
  api.get('/admin/reviews/reported').then((res) => res.data);

export const dismissReviewReport = (id) =>
  api.patch(`/admin/reviews/${id}/dismiss`).then((res) => res.data);

export const deleteReportedReview = (id) =>
  api.delete(`/admin/reviews/${id}`).then((res) => res.data);

// Gestion des categories (structure de la plateforme).
export const getCategoriesAdmin = () => api.get('/admin/categories').then((res) => res.data);

export const createCategory = (payload) =>
  api.post('/admin/categories', payload).then((res) => res.data);

export const updateCategory = (id, payload) =>
  api.patch(`/admin/categories/${id}`, payload).then((res) => res.data);

export const deleteCategory = (id) =>
  api.delete(`/admin/categories/${id}`).then((res) => res.data);

export const uploadCategoryImage = (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api
    .post(`/admin/categories/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const deleteCategoryImage = (id) =>
  api.delete(`/admin/categories/${id}/image`).then((res) => res.data);

export const uploadCategoryIcon = (id, file) => {
  const formData = new FormData();
  formData.append('icon', file);
  return api
    .post(`/admin/categories/${id}/icon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const deleteCategoryIcon = (id) =>
  api.delete(`/admin/categories/${id}/icon`).then((res) => res.data);

// Gestion des villes / regions.
export const getCitiesAdmin = () => api.get('/admin/cities').then((res) => res.data);

export const createCity = (payload) => api.post('/admin/cities', payload).then((res) => res.data);

export const updateCity = (id, payload) =>
  api.patch(`/admin/cities/${id}`, payload).then((res) => res.data);

export const deleteCity = (id) => api.delete(`/admin/cities/${id}`).then((res) => res.data);

// Services associes (liste informative FR/AR par categorie principale).
export const createAssociatedService = (categoryId, payload) =>
  api.post(`/admin/categories/${categoryId}/services`, payload).then((res) => res.data);

export const updateAssociatedService = (id, payload) =>
  api.patch(`/admin/services/${id}`, payload).then((res) => res.data);

export const deleteAssociatedService = (id) =>
  api.delete(`/admin/services/${id}`).then((res) => res.data);

// Facturation : factures d'abonnement (admin -> prestataire).
export const getSubscriptionInvoices = (params) =>
  api.get('/admin/subscription-invoices', { params }).then((res) => res.data);

export const createSubscriptionInvoice = (listingId, payload) =>
  api.post(`/admin/providers/${listingId}/subscription-invoices`, payload).then((res) => res.data);

export const updateSubscriptionInvoice = (id, payload) =>
  api.patch(`/admin/subscription-invoices/${id}`, payload).then((res) => res.data);

export const deleteSubscriptionInvoice = (id) =>
  api.delete(`/admin/subscription-invoices/${id}`).then((res) => res.data);

export const sendSubscriptionInvoice = (id) =>
  api.post(`/admin/subscription-invoices/${id}/send`).then((res) => res.data);

// Parametres admin > Plans & Tarifs (tarification, action reservee au Super Admin).
export const getPlans = () => api.get('/admin/plans').then((res) => res.data);

export const updatePlan = (key, payload) =>
  api.patch(`/admin/plans/${key}`, payload).then((res) => res.data);

// Parametres admin > Email SMTP (config systeme, reservee au Super Admin).
export const getPlatformEmailSettings = () =>
  api.get('/admin/settings/email').then((res) => res.data);

export const updatePlatformEmailSettings = (payload) =>
  api.patch('/admin/settings/email', payload).then((res) => res.data);

export const sendPlatformTestEmail = (to) =>
  api.post('/admin/settings/email/test', { to }).then((res) => res.data);
