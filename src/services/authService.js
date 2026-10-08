import api from './api';

export const register = (payload) => api.post('/auth/register', payload).then((res) => res.data);

export const login = (credentials) =>
  api.post('/auth/login', credentials).then((res) => res.data);

export const verifyEmail = (token) => api.get(`/auth/verify/${token}`).then((res) => res.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((res) => res.data);

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((res) => res.data);

export const changePassword = (currentPassword, newPassword) =>
  api
    .put('/auth/change-password', { currentPassword, newPassword })
    .then((res) => res.data);

export const getMe = () => api.get('/auth/me').then((res) => res.data);

export const updateMe = (payload) => api.patch('/auth/me', payload).then((res) => res.data);
