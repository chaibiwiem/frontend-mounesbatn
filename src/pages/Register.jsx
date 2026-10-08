import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconUser, IconMail, IconPhone, IconLock } from '../components/icons';
import UnderlineField from '../components/UnderlineField';
import { WEDDING_ROLE_OPTIONS } from '../components/AuthModal';
import { formatTunisianPhone, stripPhoneSpaces } from '../utils/phone';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  weddingRole: '',
};

// Meme design que la popup AuthModal (reference fournie par l'utilisateur :
// champs "underline" avec icone, pastilles "Je suis") - adapte en page
// complete (pas de fond noir/croix de fermeture), meme titre serif et meme
// fond que la page /login pour une identite coherente entre les deux pages
// d'authentification.
function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  // ?email= : lien de l'invitation a laisser un avis (M13) - meme adresse que
  // la demande, pour que ses reservations soient rattachees au compte.
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ ...initialState, email: searchParams.get('email') || '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'phone' ? formatTunisianPhone(value) : value });
  };

  // Re-cliquer sur l'option deja selectionnee la desactive (champ optionnel,
  // purement informatif - pas de logique metier associee).
  const toggleWeddingRole = (value) =>
    setForm((prev) => ({ ...prev, weddingRole: prev.weddingRole === value ? '' : value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const result = await register({ ...form, phone: stripPhoneSpaces(form.phone) });
      setSuccess(result.message);
      setTimeout(() => navigate('/login'), 2000);
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
          Créer un compte
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <UnderlineField
              label="Prénom"
              icon={IconUser}
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <UnderlineField
              label="Nom"
              icon={IconUser}
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <UnderlineField
            label="Email"
            icon={IconMail}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
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
            value={form.phone}
            onChange={handleChange}
            placeholder="+216..."
          />

          <UnderlineField
            label="Mot de passe"
            icon={IconLock}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
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
                    form.weddingRole === opt.value
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
            className="w-full rounded-lg bg-rose-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-rose-600 hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
