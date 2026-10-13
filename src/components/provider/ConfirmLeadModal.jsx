import { useState } from 'react';
import { confirmLead, acceptConnectionFeeTerms, formatDT, formatFeeRate } from '../../services/connectionFeeService';
import { connectionFeeTerms, CONNECTION_FEE_TERMS_VERSION } from '../../utils/connectionFeeTerms';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

// Confirmation d'une demande aboutie (M13, 1re confirmation) dans une
// categorie concernee par les frais de mise en relation. Le montant des frais
// est affiche AVANT validation : forfait fixe, ou pourcentage applique au
// montant du contrat saisi (apercu - le serveur recalcule a l'enregistrement).
// `connectionFee` : { type, value, amount, categoryName, termsAccepted }.
function ConfirmLeadModal({ lead, connectionFee, onConfirmed, onCancel }) {
  const [eventDate, setEventDate] = useState(lead.eventDate || lead.checkInDate || '');
  // Reservation deja enregistree pour la demande : son MONTANT TOTAL (jamais
  // l'acompte) est la base de calcul - verrouille, le serveur l'impose aussi.
  const bookingTotal = Number(lead.bookings?.find((b) => Number(b.totalPrice) > 0)?.totalPrice) || null;
  const [declaredAmount, setDeclaredAmount] = useState(bookingTotal ? String(bookingTotal) : '');
  const [fromMounesba, setFromMounesba] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isPercent = connectionFee.type === 'percent';
  const rateLabel = formatFeeRate(connectionFee);
  // Apercu du montant : en pourcentage, connu seulement une fois le contrat saisi.
  const previewAmount = isPercent
    ? Number(declaredAmount) > 0
      ? Math.round(Number(declaredAmount) * Number(connectionFee.value)) / 100
      : null
    : connectionFee.amount;
  const amountLabel = previewAmount === null ? null : formatDT(previewAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!eventDate) {
      setError("La date de l'événement est requise.");
      return;
    }
    if (isPercent && !(Number(declaredAmount) > 0)) {
      setError('Le montant du contrat est obligatoire : les frais sont calculés en pourcentage de ce montant.');
      return;
    }
    if (!fromMounesba) {
      setError('Confirmez que ce client vous a contacté via Mounesba.');
      return;
    }
    if (!connectionFee.termsAccepted && !acceptTerms) {
      setError('Acceptez les conditions des frais de mise en relation.');
      return;
    }
    setSubmitting(true);
    try {
      if (!connectionFee.termsAccepted) await acceptConnectionFeeTerms();
      const commission = await confirmLead(lead.id, { eventDate, declaredAmount: declaredAmount || undefined });
      onConfirmed?.(commission);
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de confirmer cette demande.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-gray-900">Confirmer une demande aboutie</h3>
        <p className="mt-1 text-sm text-gray-500">
          Demande de {lead.firstName} {lead.lastName}
        </p>

        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm text-gray-700">Frais de mise en relation pour cette demande</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {amountLabel || <span className="text-base font-semibold text-gray-500">Saisissez le montant du contrat</span>}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {isPercent
              ? `${rateLabel} (${connectionFee.categoryName}).`
              : `Forfait fixe (${connectionFee.categoryName}), quel que soit le montant de votre contrat.`}{' '}
            Dû uniquement après validation par Mounesba, puis regroupé dans votre facture mensuelle.
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800">
            Aucun paiement n&apos;a lieu sur la plateforme : règlement hors ligne (espèces ou virement).
          </p>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          En confirmant, cet événement comptera dans les « événements réalisés via Mounesba » affichés sur votre
          fiche, dans votre taux de conversion et dans votre classement, et votre client sera invité à laisser un
          avis vérifié.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Date de l&apos;événement *</label>
              <input required type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                Montant total du contrat (DT){' '}
                {isPercent ? '*' : <span className="font-normal text-gray-400">(facultatif)</span>}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={declaredAmount}
                onChange={(e) => setDeclaredAmount(e.target.value)}
                readOnly={Boolean(bookingTotal)}
                className={`${inputClass} ${bookingTotal ? 'bg-gray-50 font-semibold' : ''}`}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-gray-400">
            {isPercent
              ? bookingTotal
                ? 'Montant total de la réservation enregistrée (acompte non pris en compte) : base de calcul des frais.'
                : 'Base de calcul des frais : le montant TOTAL convenu avec le client, pas l’acompte.'
              : "Le montant du contrat est informatif : il n'entre pas dans le calcul des frais."}
          </p>

          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={fromMounesba}
              onChange={(e) => setFromMounesba(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            Je confirme que ce client m&apos;a contacté via Mounesba et que la demande a abouti.
          </label>

          {!connectionFee.termsAccepted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">
                Conditions des frais de mise en relation (version {CONNECTION_FEE_TERMS_VERSION})
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900">
                {connectionFeeTerms(rateLabel).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <label className="mt-2 flex items-start gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                J&apos;accepte les conditions des frais de mise en relation.
              </label>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Plus tard
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Confirmation...' : amountLabel ? `Confirmer (${amountLabel})` : 'Confirmer'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmLeadModal;
