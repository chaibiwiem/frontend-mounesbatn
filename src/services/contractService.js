import api from './api';

export const getContracts = () => api.get('/contracts').then((res) => res.data);

export const createContract = (payload) => api.post('/contracts', payload).then((res) => res.data);

export const updateContract = (id, payload) =>
  api.patch(`/contracts/${id}`, payload).then((res) => res.data);

export const sendContract = (id) => api.post(`/contracts/${id}/send`).then((res) => res.data);
