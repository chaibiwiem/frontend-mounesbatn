import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateMe, changePassword } from '../../services/authService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const initialPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Meme structure que AdminProfileSettings.jsx / ProviderDashboard ProfileTab
// (infos du compte + changement de mot de passe) - adaptee au client, sans
// les champs specifiques a une fiche prestataire.
function ClientSettingsTab() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const initial = (user?.firstName || '?').charAt(0).toUpperCase();
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage('Mot de passe modifié avec succès.');
      setPasswordForm(initialPasswordForm);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de changer le mot de passe.'
      );
    } finally {
      setChangingPassword(false);
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
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Mon profil</h2>

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

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
        </button>
      </form>

      <div className="mt-10 max-w-lg border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-900">Sécurité du compte</h2>
        <p className="mt-1 text-sm text-gray-500">Changez votre mot de passe.</p>

        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Mot de passe actuel</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nouveau mot de passe</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>

          {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {changingPassword ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClientSettingsTab;
