import { useState } from 'react';
import { IconCheckCircle } from '../icons';

// Reinitialisation du mot de passe d'un prestataire (Super Admin, M10) -
// meme principe en 2 temps que CreateProviderForm apres creation : on
// confirme, l'API genere un mot de passe temporaire lisible, puis on
// l'affiche (copiable) pour que l'admin puisse le communiquer directement si
// l'email echoue - ConfirmModal seul ne permet pas d'afficher la valeur
// retournee par onConfirm, d'ou ce composant dedie.
function ResetPasswordModal({ listing, onConfirm, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const data = await onConfirm();
      setTemporaryPassword(data.temporaryPassword);
    } catch (err) {
      setError(err.response?.data?.message || 'Action impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      // Copie manuelle toujours possible (le mot de passe reste affiche a l'ecran).
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {temporaryPassword ? (
          <>
            <h3 className="text-lg font-bold text-gray-900">Mot de passe réinitialisé</h3>
            <p className="mt-2 text-sm text-gray-500">
              Envoyé par email à {listing.owner?.email}. Vous pouvez aussi le communiquer directement :
            </p>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <code className="text-base font-semibold tracking-wide text-gray-900">{temporaryPassword}</code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                {copied ? <IconCheckCircle className="h-4 w-4" /> : 'Copier'}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900">Réinitialiser le mot de passe</h3>
            <p className="mt-2 text-sm text-gray-500">
              Un nouveau mot de passe temporaire sera généré pour {listing.owner?.firstName}{' '}
              {listing.owner?.lastName} ("{listing.title}") et lui sera envoyé par email.
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? 'Réinitialisation...' : 'Réinitialiser'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordModal;
