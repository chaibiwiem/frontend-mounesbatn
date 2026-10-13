import { useState } from 'react';
import { changePassword } from '../../services/authService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const initialPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Meme endpoint que ProfileTab.jsx (prestataire) : PUT /auth/change-password,
// commun a tous les roles (verifyToken uniquement, pas de restriction de role
// cote backend).
function AdminSecuritySettings() {
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = (e) =>
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      <h3 className="text-lg font-bold text-gray-900">Sécurité du compte</h3>
      <p className="mt-1 text-sm text-gray-500">Changez votre mot de passe administrateur.</p>

      <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
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
          className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {changingPassword ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </form>
    </div>
  );
}

export default AdminSecuritySettings;
