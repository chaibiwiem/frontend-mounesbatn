import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function StatusReasonModal({ title, description, confirmLabel, showReason, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(reason || undefined);
    } catch (err) {
      setError(err.response?.data?.message || 'Action impossible.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}

        {showReason && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Motif (optionnel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusReasonModal;
