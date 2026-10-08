import { useCallback, useEffect, useState } from 'react';
import {
  getListingConnectionFees,
  disputeConnectionFee,
  FEE_STATUS_LABELS,
  FEE_STATUS_COLORS,
  formatDT,
  formatFeeRate,
} from '../../services/connectionFeeService';
import { formatDateOnly } from '../../utils/stay';
import ConnectionFeeTermsCard from './ConnectionFeeTermsCard';
import { openDocument } from '../../services/documentService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function DisputeModal({ fee, onSubmit, onCancel }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (comment.trim().length < 5) {
      setError('Expliquez votre contestation (5 caractères minimum).');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(comment.trim());
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de contester.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Contester ces frais</h3>
        <p className="mt-1 text-sm text-gray-500">
          Demande de {fee.lead?.firstName} {fee.lead?.lastName} — {formatDT(fee.amount)}. La ligne repasse en
          attente de validation par Mounesba.
        </p>
        <label className="mt-4 block text-xs font-medium text-gray-700">Motif</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="ex : l'événement a été annulé par le client"
          className={inputClass}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Envoi...' : 'Contester'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Onglet "Frais de mise en relation" (M13) : visible uniquement pour une
// fiche dont la categorie est concernee (voir ProviderDashboard).
function ConnectionFeesTab({ listingId, onChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [disputing, setDisputing] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await getListingConnectionFees(listingId));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos frais de mise en relation.');
    }
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-500">Chargement...</p>;

  const rateLabel = data.fee ? formatFeeRate(data.fee) : null;
  const isPercent = data.fee?.type === 'percent';

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Frais de mise en relation</h2>
      <p className="mt-1 text-sm text-gray-500">
        {isPercent
          ? `Des frais de ${rateLabel} sont dus`
          : `Un forfait fixe${rateLabel ? ` de ${rateLabel}` : ''} est dû`}{' '}
        pour chaque demande reçue via Mounesba qui aboutit, après votre confirmation et la validation de Mounesba.
      </p>

      {data.terms.accepted && data.terms.acceptedAt && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
          Conditions acceptées le {new Date(data.terms.acceptedAt).toLocaleDateString('fr-FR')} (version{' '}
          {data.terms.version})
        </p>
      )}

      {!data.terms.accepted && (
        <div className="mt-4">
          <ConnectionFeeTermsCard
            rateLabel={rateLabel}
            onAccepted={() => {
              load();
              onChange?.();
            }}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total du mois en cours</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatDT(data.totals.month)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total de l&apos;année</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatDT(data.totals.year)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Événements réalisés via Mounesba</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{data.realizedCount}</p>
          <p className="text-xs text-gray-400">Affiché sur votre fiche publique</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Aucun paiement n&apos;a lieu sur la plateforme : les frais validés sont regroupés dans une facture
        mensuelle, réglée en espèces ou par virement.
      </div>

      {data.commissions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Aucune demande confirmée pour l&apos;instant. Confirmez une demande aboutie depuis l&apos;onglet
          « Demandes ».
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[860px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Client', 'Catégorie', 'Montant', 'Statut', 'Facture', ''].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.commissions.map((fee) => (
                <tr key={fee.id} className="align-top hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(fee.eventDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {fee.lead ? `${fee.lead.firstName} ${fee.lead.lastName}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{fee.category?.name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{formatDT(fee.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${FEE_STATUS_COLORS[fee.status]}`}
                    >
                      {FEE_STATUS_LABELS[fee.status]}
                    </span>
                    {fee.status === 'cancelled' && fee.cancelReason && (
                      <p className="mt-1 max-w-[220px] text-xs text-gray-500">{fee.cancelReason}</p>
                    )}
                    {fee.status === 'pending_admin' && fee.disputeComment && (
                      <p className="mt-1 max-w-[220px] text-xs text-gray-500">Contestée : {fee.disputeComment}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {fee.invoice ? (
                      <a
                        href={fee.invoice.pdfUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          openDocument(fee.invoice.pdfUrl);
                        }}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-rose-600 hover:underline"
                      >
                        {fee.invoice.number}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {fee.status === 'validated' && (
                      <button
                        type="button"
                        onClick={() => setDisputing(fee)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Contester
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mt-8 text-lg font-bold text-gray-900">Mes factures Mounesba</h3>
      <p className="mt-1 text-sm text-gray-500">
        Factures mensuelles des frais validés, à régler hors plateforme (espèces ou virement).
      </p>
      {data.invoices.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Aucune facture pour l&apos;instant. Une facture est émise en fin de mois pour les demandes que vous avez
          confirmées et que Mounesba a validées.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[720px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Numéro', 'Période', 'Montant TTC', 'Émise le', 'Échéance', 'Statut'].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={invoice.pdfUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        openDocument(invoice.pdfUrl);
                      }}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-rose-600 hover:underline"
                    >
                      {invoice.number}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.period}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{formatDT(invoice.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(invoice.issuedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(invoice.dueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Réglée' : invoice.status === 'cancelled' ? 'Annulée' : 'À régler'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {disputing && (
        <DisputeModal
          fee={disputing}
          onCancel={() => setDisputing(null)}
          onSubmit={async (comment) => {
            await disputeConnectionFee(disputing.id, comment);
            setDisputing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

export default ConnectionFeesTab;
