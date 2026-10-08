import api from './api';

// Frais de mise en relation (MODULES.md M13). Les montants sont toujours
// calcules par le serveur (forfait fixe de la categorie) : le client n'envoie
// jamais de montant de frais.

// --- Prestataire ---
export const getListingConnectionFees = (listingId) =>
  api.get(`/listings/${listingId}/commissions`).then((res) => res.data);

export const acceptConnectionFeeTerms = () =>
  api.post('/listings/me/connection-fee-terms', { accept: true }).then((res) => res.data);

export const confirmLead = (leadId, payload) =>
  api.post(`/leads/${leadId}/confirm`, { ...payload, fromMounesba: true }).then((res) => res.data);

export const disputeConnectionFee = (id, comment) =>
  api.post(`/commissions/${id}/dispute`, { comment }).then((res) => res.data);

// --- Admin ---
export const getAdminConnectionFees = (params) =>
  api.get('/admin/commissions', { params }).then((res) => res.data);

export const validateConnectionFee = (id) =>
  api.patch(`/admin/commissions/${id}/validate`).then((res) => res.data);

export const cancelConnectionFee = (id, reason) =>
  api.patch(`/admin/commissions/${id}/cancel`, { reason }).then((res) => res.data);

export const generateConnectionFeeInvoices = (payload) =>
  api.post('/admin/commissions/invoice', payload).then((res) => res.data);

export const getConnectionFeeInvoices = (params) =>
  api.get('/admin/commissions/invoices', { params }).then((res) => res.data);

export const updateConnectionFeeInvoiceStatus = (id, status) =>
  api.patch(`/admin/commissions/invoices/${id}/status`, { status }).then((res) => res.data);

export const getConnectionFeeStats = (params) =>
  api.get('/admin/commissions/stats', { params }).then((res) => res.data);

// Libelles de statut (vocabulaire : "frais de mise en relation", jamais
// "commission").
export const FEE_STATUS_LABELS = {
  pending_provider: 'À confirmer',
  pending_admin: 'En attente de validation',
  validated: 'Validé',
  invoiced: 'Facturé',
  paid: 'Réglé',
  cancelled: 'Annulé',
};

export const FEE_STATUS_COLORS = {
  pending_provider: 'bg-gray-100 text-gray-600',
  pending_admin: 'bg-amber-100 text-amber-700',
  validated: 'bg-blue-100 text-blue-700',
  invoiced: 'bg-violet-100 text-violet-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export const formatDT = (value) => `${Number(value || 0).toFixed(2)} DT`;

// Tarif lisible : "150.00 DT" (forfait fixe) ou "10 % du montant du contrat".
// `rate` : { type, value } (API prestataire) ou { commissionType,
// commissionValue } (categorie admin).
export const formatFeeRate = (rate) => {
  if (!rate) return '';
  const type = rate.type || rate.commissionType || 'fixed';
  const value = rate.value ?? rate.commissionValue;
  return type === 'percent' ? `${Number(value)} % du montant du contrat` : formatDT(value);
};
