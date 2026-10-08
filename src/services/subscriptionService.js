import api from './api';

// Lecture seule : le changement de plan est gere par l'admin (tableau
// Prestataires), pas de self-service prestataire (CLAUDE.md).
export const getMySubscription = () =>
  api.get('/subscriptions/me').then((res) => res.data);
