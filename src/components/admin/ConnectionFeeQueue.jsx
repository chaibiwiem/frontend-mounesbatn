import { useCallback, useEffect, useState } from 'react';
import {
  getAdminConnectionFees,
  validateConnectionFee,
  cancelConnectionFee,
  FEE_STATUS_LABELS,
  FEE_STATUS_COLORS,
  formatDT,
} from '../../services/connectionFeeService';
import { formatDateOnly } from '../../utils/stay';
import { openDocument } from '../../services/documentService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const STATUS_FILTERS = ['pending_admin', 'validated', 'invoiced', 'paid', 'cancelled', ''];
const CANCEL_REASONS = ['Demande non aboutie', 'Doublon', 'Litige', 'Contrat annulé'];

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

function CancelModal({ fee, onSubmit, onClose }) {
  const [preset, setPreset] = useState(CANCEL_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(details.trim() ? `${preset} — ${details.trim()}` : preset);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Impossible d'annuler.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Annuler ces frais</h3>
        <p className="mt-1 text-sm text-gray-500">
          {fee.listing?.title} — demande de {fee.lead?.firstName} {fee.lead?.lastName} ({formatDT(fee.amount)})
        </p>
        <label className={`${labelClass} mt-4`}>Motif *</label>
        <select required value={preset} onChange={(e) => setPreset(e.target.value)} className={inputClass}>
          {CANCEL_REASONS.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
        <label className={`${labelClass} mt-3`}>Précisions (facultatif)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          maxLength={200}
          className={inputClass}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Annulation...' : 'Annuler les frais'}
          </button>
        </div>
      </form>
    </div>
  );
}

// File d'attente des frais de mise en relation (M13) : detail du lead
// d'origine (coordonnees du client pour verification), validation (2e
// confirmation) ou annulation motivee.
function ConnectionFeeQueue({ categories, providers }) {
  const [filters, setFilters] = useState({ status: 'pending_admin', categoryId: '', listingId: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = { page };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      setData(await getAdminConnectionFees(params));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la file des frais.');
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleValidate = async (fee) => {
    setBusyId(fee.id);
    try {
      await validateConnectionFee(fee.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Validation impossible.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status || 'all'}
            type="button"
            onClick={() => setFilter('status', status)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.status === status ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status ? FEE_STATUS_LABELS[status] : 'Tous'}
            {status && data?.statusCounts?.[status] ? ` (${data.statusCounts[status]})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Prestataire</label>
          <select value={filters.listingId} onChange={(e) => setFilter('listingId', e.target.value)} className={inputClass}>
            <option value="">Tous</option>
            {providers.map((p) => (
              <option key={p.listingId} value={p.listingId}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Catégorie</label>
          <select value={filters.categoryId} onChange={(e) => setFilter('categoryId', e.target.value)} className={inputClass}>
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Confirmée du</label>
          <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>au</label>
          <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={inputClass} />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!data ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : data.commissions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Aucune ligne pour ces filtres.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.commissions.map((fee) => (
            <div key={fee.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {fee.listing?.title}{' '}
                    <span className="font-normal text-gray-500">· {fee.category?.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Confirmée par le prestataire le {formatDateTime(fee.providerConfirmedAt)}
                    {fee.validatedBy &&
                      ` · validée par ${fee.validatedBy.firstName} ${fee.validatedBy.lastName} le ${formatDateTime(
                        fee.adminValidatedAt
                      )}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{formatDT(fee.amount)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${FEE_STATUS_COLORS[fee.status]}`}>
                    {FEE_STATUS_LABELS[fee.status]}
                  </span>
                </div>
              </div>

              {fee.disputeComment && fee.status === 'pending_admin' && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Contestée par le prestataire : « {fee.disputeComment} »
                </p>
              )}
              {fee.cancelReason && fee.status === 'cancelled' && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Motif : {fee.cancelReason}</p>
              )}
              {!fee.listing?.connectionFeeTermsAcceptedAt && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  Conditions non acceptées par le prestataire : ces frais ne pourront pas être facturés.
                </p>
              )}

              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-400">Client (demande d&apos;origine)</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {fee.lead?.firstName} {fee.lead?.lastName}
                  </p>
                  <p className="text-gray-600">
                    <a href={`tel:${fee.lead?.phone}`} className="hover:underline">
                      {fee.lead?.phone}
                    </a>
                  </p>
                  <p className="break-all text-gray-600">
                    <a href={`mailto:${fee.lead?.email}`} className="hover:underline">
                      {fee.lead?.email}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Demande reçue le {formatDateTime(fee.lead?.createdAt)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-400">Événement</p>
                  <p className="mt-1 text-gray-700">Date déclarée : {formatDateOnly(fee.eventDate)}</p>
                  <p className="text-gray-700">
                    Date demandée : {formatDateOnly(fee.lead?.eventDate || fee.lead?.checkInDate)}
                  </p>
                  {fee.lead?.guests && <p className="text-gray-700">Invités : {fee.lead.guests}</p>}
                  <p className="text-gray-700">
                    Contrat déclaré : {fee.declaredAmount ? formatDT(fee.declaredAmount) : 'non renseigné'}
                  </p>
                  {fee.lead?.message && (
                    <p className="mt-1 line-clamp-3 text-xs text-gray-500" title={fee.lead.message}>
                      « {fee.lead.message} »
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-400">Prestataire</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {fee.listing?.owner?.firstName} {fee.listing?.owner?.lastName}
                  </p>
                  <p className="text-gray-600">{fee.listing?.owner?.phone || '—'}</p>
                  <p className="break-all text-gray-600">{fee.listing?.owner?.email}</p>
                  {fee.invoice && (
                    <a
                      href={fee.invoice.pdfUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        openDocument(fee.invoice.pdfUrl);
                      }}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Facture {fee.invoice.number}
                    </a>
                  )}
                </div>
              </div>

              {['pending_admin', 'validated'].includes(fee.status) && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelling(fee)}
                    disabled={busyId === fee.id}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler avec motif
                  </button>
                  {fee.status === 'pending_admin' && (
                    <button
                      type="button"
                      onClick={() => handleValidate(fee)}
                      disabled={busyId === fee.id}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {busyId === fee.id ? 'Validation...' : 'Valider'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-gray-500">
                Page {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {cancelling && (
        <CancelModal
          fee={cancelling}
          onClose={() => setCancelling(null)}
          onSubmit={async (reason) => {
            await cancelConnectionFee(cancelling.id, reason);
            setCancelling(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

export default ConnectionFeeQueue;
