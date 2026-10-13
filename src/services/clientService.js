import api from './api';

export const getClients = (params) => api.get('/clients', { params }).then((res) => res.data);

export const getClient = (id) => api.get(`/clients/${id}`).then((res) => res.data);

export const updateClient = (id, payload) =>
  api.patch(`/clients/${id}`, payload).then((res) => res.data);

export const clearManualTag = (id) =>
  api.patch(`/clients/${id}/clear-manual-tag`).then((res) => res.data);

export const deleteClient = (id) => api.delete(`/clients/${id}`).then((res) => res.data);

// L'export exige le token JWT (Authorization header) : impossible via un
// simple lien <a href>, on recupere donc le CSV en blob puis on declenche
// le telechargement manuellement.
export const exportClientsCsv = () =>
  api.get('/clients/export', { responseType: 'blob' }).then((res) => res.data);
