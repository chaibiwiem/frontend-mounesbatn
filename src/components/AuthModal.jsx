import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconX, IconUser, IconMail, IconPhone, IconLock } from './icons';
import UnderlineField from './UnderlineField';
import { formatTunisianPhone, stripPhoneSpaces } from '../utils/phone';

const REGISTER_INITIAL = { firstName: '', lastName: '', email: '', phone: '', password: '', weddingRole: '' };

export const WEDDING_ROLE_OPTIONS = [
  { value: 'bride', label: 'Mariée' },
  { value: 'groom', label: 'Marié' },
  { value: 'other', label: 'Autre' },
];

function AuthModal({ initialMode = 'login', onClose }) {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(REGISTER_INITIAL);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleLoginChange = (e) => setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: name === 'phone' ? formatTunisianPhone(value) : value }));
  };

  // Toggle : re-cliquer sur l'option deja selectionnee la desactive (champ
  // optionnel, purement informatif - pas de logique metier associee).
  const toggleWeddingRole = (value) =>
    setRegisterForm((prev) => ({ ...prev, weddingRole: prev.weddingRole === value ? '' : value }));

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(loginForm);
      onClose();
      if (loggedInUser.role === 'provider') navigate('/prestataire/dashboard');
      else if (loggedInUser.role === 'admin') navigate('/admin/dashboard');
      else if (loggedInUser.role === 'client') navigate('/client/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  // Inscription client uniquement (pas de champ role) : les prestataires
  // passent par le formulaire complet /register (documents legaux, categorie,
  // ville...), inadapte a une popup courte.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const result = await register({ ...registerForm, phone: stripPhoneSpaces(registerForm.phone), role: 'client' });
      setSuccess(result.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const goToForgotPassword = () => {
    onClose();
    navigate('/forgot-password');
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <IconX className="h-5 w-5" />
        </button>

        <div className="shrink-0 px-8 pb-2 pt-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-4">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <UnderlineField
                label="Email"
                icon={IconMail}
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
              />
              <div>
                <UnderlineField
                  label="Mot de passe"
                  icon={IconLock}
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
                <button
                  type="button"
                  onClick={goToForgotPassword}
                  className="mt-2 block text-right text-xs text-gray-500 underline hover:text-rose-600"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-rose-600 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-rose-600 underline hover:text-rose-700"
                >
                  Inscrivez-vous
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <UnderlineField
                  label="Prénom"
                  icon={IconUser}
                  name="firstName"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  required
                />
                <UnderlineField
                  label="Nom"
                  icon={IconUser}
                  name="lastName"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <UnderlineField
                label="Email"
                icon={IconMail}
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                required
              />

              <UnderlineField
                label="Téléphone"
                icon={IconPhone}
                type="tel"
                pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
                inputMode="tel"
                autoComplete="tel"
                name="phone"
                value={registerForm.phone}
                onChange={handleRegisterChange}
                placeholder="+216..."
              />

              <UnderlineField
                label="Mot de passe"
                icon={IconLock}
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                minLength={8}
                required
              />

              <div>
                <label className="block text-xs font-medium text-gray-500">Je suis</label>
                <div className="mt-2 flex gap-2">
                  {WEDDING_ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleWeddingRole(opt.value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        registerForm.weddingRole === opt.value
                          ? 'bg-rose-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-rose-600 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Déjà inscrit ?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-rose-600 underline hover:text-rose-700"
                >
                  Connectez-vous
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
