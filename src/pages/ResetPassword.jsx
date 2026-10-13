import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as authService from '../services/authService';
import { IconEye, IconEyeOff } from '../components/icons';

// Meme design que Login.jsx (titre serif, champ a label "encoche" sur la
// bordure, bascule afficher/masquer sur le mot de passe, bouton pleine
// largeur) pour une experience coherente sur tout le parcours authentification.
function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.resetPassword(token, password);
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.');
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
          Réinitialiser le mot de passe
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-7">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs font-medium text-gray-500">
              Nouveau mot de passe *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 pr-11 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          </div>

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Réinitialiser'}
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

export default ResetPassword;
