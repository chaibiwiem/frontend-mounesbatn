import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateMe } from '../../services/authService';
import { ADMIN_ROLE_LABELS } from './AdminLayout';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

function AdminProfileSettings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initial = (user?.firstName || '?').charAt(0).toUpperCase();
  const roleLabel = ADMIN_ROLE_LABELS[user?.adminRole] || 'Admin';
  const emailChanged = form.email !== user?.email;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await updateMe(form);
      updateUser(data.user);
      setMessage(
        emailChanged
          ? 'Profil enregistré. Un email de vérification a été envoyé à votre nouvelle adresse.'
          : 'Profil enregistré avec succès.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de sauvegarder le profil.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 rounded-xl bg-rose-50 p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-200 text-xl font-bold text-rose-700">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-sm text-gray-500">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-800">
            {roleLabel}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prénom</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Nom</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Adresse email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            required
          />
          {emailChanged && (
            <p className="mt-1 text-xs text-amber-600">
              Changer votre email nécessitera une nouvelle vérification avant votre prochaine connexion.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Rôle</label>
          <input value={roleLabel} disabled className={`${inputClass} bg-gray-50 text-gray-400`} />
        </div>

        {formatDate(user?.lastLoginAt) && (
          <p className="text-xs text-gray-400">Dernière connexion : {formatDate(user.lastLoginAt)}</p>
        )}

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
        </button>
      </form>
    </div>
  );
}

export default AdminProfileSettings;
