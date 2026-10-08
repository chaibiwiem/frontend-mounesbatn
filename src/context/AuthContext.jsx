import { createContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const TOKEN_KEY = 'farahbooking_token';
const REFRESH_TOKEN_KEY = 'farahbooking_refresh_token';
const USER_KEY = 'farahbooking_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Rafraichit le profil en cache au chargement : evite qu'un champ ajoute
  // apres la derniere connexion (ex. adminRole) reste absent tant que
  // l'utilisateur ne se reconnecte pas manuellement.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    authService
      .getMe()
      .then((data) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        // Token invalide/expire : l'intercepteur axios gere deja le
        // rafraichissement/la deconnexion, rien a faire ici.
      });
  }, []);

  async function login(credentials) {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      return await authService.register(payload);
    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Erreur lors de l'inscription.";
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  // Rafraichit le cache local (localStorage + state) apres une modification
  // du compte connecte (ex. Parametres admin > Mon profil) sans repasser par
  // login() - evite un GET /auth/me supplementaire quand l'appelant a deja
  // la reponse a jour du serveur.
  function updateUser(nextUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
