import api from './api';

export const createLead = (payload) => api.post('/leads', payload).then((res) => res.data);

export const getMyLeads = () => api.get('/leads/me').then((res) => res.data);

export const getListingLeads = (listingId) =>
  api.get(`/listings/${listingId}/leads`).then((res) => res.data);

export const updateLeadStatus = (leadId, status) =>
  api.patch(`/leads/${leadId}/status`, { status }).then((res) => res.data);

export const exportListingLeads = async (listingId) => {
  const res = await api.get(`/listings/${listingId}/leads/export`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `demandes-devis-${listingId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
