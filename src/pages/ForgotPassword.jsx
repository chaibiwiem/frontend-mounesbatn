import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/authService';

// Meme design que Login.jsx (titre serif, champ a label "encoche" sur la
// bordure, bouton pleine largeur, pas de carte/ombre - directement sur le
// fond de page) - pour une experience visuelle coherente entre les pages
// d'authentification.
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await authService.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-[50px]">
      <div className="mx-auto w-full max-w-md">
        <h1
          className="text-center text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Mot de passe oublié
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-7">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs font-medium text-gray-500">
              Adresse email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {message && <p className="text-sm text-gray-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="font-semibold text-rose-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
