import api from './api';

export const createPackage = (payload) => api.post('/packages', payload).then((res) => res.data);

export const updatePackage = (id, payload) =>
  api.patch(`/packages/${id}`, payload).then((res) => res.data);

export const deletePackage = (id) => api.delete(`/packages/${id}`).then((res) => res.data);
