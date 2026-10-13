import { useState } from 'react';

// Popup de confirmation generique pour les actions non destructives du
// dashboard prestataire (ex: envoyer une facture/un contrat par email) -
// bouton de confirmation en rose (couleur d'action principale de l'app),
// contrairement a ConfirmModal admin (rouge, reserve aux suppressions).
function ConfirmModal({ title, description, confirmLabel = 'Confirmer', onConfirm, onCancel }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.response?.data?.message || 'Action impossible.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
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
            {submitting ? 'Envoi...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
