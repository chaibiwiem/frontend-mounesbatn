import api from './api';

export const getInvoices = () => api.get('/invoices').then((res) => res.data);

export const createInvoice = (payload) => api.post('/invoices', payload).then((res) => res.data);

export const updateInvoiceStatus = (id, status) =>
  api.patch(`/invoices/${id}/status`, { status }).then((res) => res.data);

export const updateInvoice = (id, payload) =>
  api.patch(`/invoices/${id}`, payload).then((res) => res.data);

export const sendInvoice = (id) => api.post(`/invoices/${id}/send`).then((res) => res.data);
