import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconEye, IconEyeOff } from '../components/icons';

// Design aligne sur la reference fournie (titre serif, champs a label
// "encoche" sur la bordure, mot de passe avec bascule afficher/masquer,
// bouton pleine largeur) - sans le bouton Google (CLAUDE.md, regle
// structurante n°5 : authentification email/mot de passe uniquement, pas
// d'OAuth) ni la case "Se souvenir de moi" (la session persiste deja par
// defaut via localStorage, ajouter une case a cocher purement decorative
// serait une fonctionnalite factice).
function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pre-remplissage depuis le lien envoye par email (creation de compte
  // prestataire / reinitialisation de mot de passe par l'admin, cf.
  // emailService.js) : email en query param (?email=...), mot de passe
  // temporaire dans le fragment (#password=...) plutot qu'en query param -
  // le fragment n'est jamais envoye au serveur ni present dans les logs
  // d'acces, limite l'exposition du mot de passe en clair. Le fragment est
  // retire de l'URL une fois lu pour ne pas le laisser trainer dans la barre
  // d'adresse/l'historique plus longtemps que necessaire.
  useEffect(() => {
    const emailFromLink = new URLSearchParams(location.search).get('email');
    const passwordFromLink = location.hash.startsWith('#password=')
      ? decodeURIComponent(location.hash.slice('#password='.length))
      : '';

    if (emailFromLink || passwordFromLink) {
      setForm((prev) => ({
        email: emailFromLink || prev.email,
        password: passwordFromLink || prev.password,
      }));
      if (passwordFromLink) setShowPassword(true);
      if (location.hash) {
        window.history.replaceState(null, '', location.pathname + location.search);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(form);
      let defaultPath = '/';
      if (loggedInUser.role === 'provider') defaultPath = '/prestataire/dashboard';
      else if (loggedInUser.role === 'admin') defaultPath = '/admin/dashboard';
      const redirectTo = location.state?.from?.pathname || defaultPath;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-[50px]">
      <div className="mx-auto w-full max-w-md">
        <h1
          className="text-center text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-7">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs font-medium text-gray-500">
              Adresse email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs font-medium text-gray-500">
              Mot de passe *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
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

          <div className="flex justify-end text-sm">
            <Link to="/forgot-password" className="text-rose-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-rose-600 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
