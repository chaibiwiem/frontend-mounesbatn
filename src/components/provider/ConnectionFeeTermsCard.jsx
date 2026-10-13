import { useState } from 'react';
import { acceptConnectionFeeTerms } from '../../services/connectionFeeService';
import { connectionFeeTerms, CONNECTION_FEE_TERMS_VERSION } from '../../utils/connectionFeeTerms';

// Acceptation des conditions de frais de mise en relation par le prestataire
// lui-meme (date + version enregistrees cote serveur). Sans acceptation,
// aucune demande ne peut etre confirmee ni aucun frais reclame.
function ConnectionFeeTermsCard({ rateLabel, onAccepted }) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setError('');
    setSubmitting(true);
    try {
      const result = await acceptConnectionFeeTerms();
      onAccepted?.(result);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Impossible d'enregistrer votre accord.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">
        Conditions de référencement — frais de mise en relation (version {CONNECTION_FEE_TERMS_VERSION})
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
        {connectionFeeTerms(rateLabel).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <label className="mt-3 flex items-start gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
        />
        J&apos;accepte les conditions des frais de mise en relation.
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleAccept}
        disabled={!checked || submitting}
        className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {submitting ? 'Enregistrement...' : 'Accepter les conditions'}
      </button>
    </div>
  );
}

export default ConnectionFeeTermsCard;
