import { useCallback, useEffect, useState } from 'react';
import {
  getAdminConnectionFees,
  getConnectionFeeInvoices,
  generateConnectionFeeInvoices,
  updateConnectionFeeInvoiceStatus,
  formatDT,
} from '../../services/connectionFeeService';
import { formatDateOnly } from '../../utils/stay';
import { openDocument } from '../../services/documentService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const INVOICE_STATUS = {
  unpaid: { label: 'Non réglée', className: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Réglée', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', className: 'bg-rose-100 text-rose-700' },
};

// Mois en cours par defaut : la facture reprend les frais valides jusqu'a la
// fin du mois choisi - un mois passe ignorerait ceux valides depuis.
const currentMonth = () => new Date().toISOString().slice(0, 7);
const formatMonth = (period) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

// Factures mensuelles des frais de mise en relation (M13) : generation (une
// facture par prestataire, lignes 'validated' uniquement), reglement recu
// hors plateforme, annulation (les lignes redeviennent refacturables).
function ConnectionFeeInvoices({ providers, onChange }) {
  const [month, setMonth] = useState(currentMonth());
  // Frais valides en attente de facturation, regroupes par prestataire.
  const [toInvoice, setToInvoice] = useState([]);
  const [listingId, setListingId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [invoicesData, validated] = await Promise.all([
        getConnectionFeeInvoices(),
        getAdminConnectionFees({ status: 'validated', limit: 100 }),
      ]);
      setInvoices(invoicesData);
      const groups = new Map();
      validated.commissions.forEach((fee) => {
        const key = fee.listingId;
        const group = groups.get(key) || {
          listingId: key,
          title: fee.listing?.title || '—',
          termsAccepted: Boolean(fee.listing?.connectionFeeTermsAcceptedAt),
          count: 0,
          total: 0,
          lastValidatedAt: null,
        };
        group.count += 1;
        group.total += Number(fee.amount);
        if (!group.lastValidatedAt || fee.adminValidatedAt > group.lastValidatedAt) {
          group.lastValidatedAt = fee.adminValidatedAt;
        }
        groups.set(key, group);
      });
      setToInvoice([...groups.values()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les factures.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Liste des prestataires : fournie par la section dediee (statistiques),
  // sinon deduite des frais a facturer (onglet Facturation).
  const providerOptions = providers.length > 0 ? providers : toInvoice.map(({ listingId: id, title }) => ({ listingId: id, title }));

  const handleGenerate = async (targetListingId = listingId) => {
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const data = await generateConnectionFeeInvoices({ month, listingId: targetListingId || undefined });
      setResult(data);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Génération impossible.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatus = async (invoice, status) => {
    setBusyId(invoice.id);
    setError('');
    try {
      await updateConnectionFeeInvoiceStatus(invoice.id, status);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Mise à jour impossible.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="font-semibold text-gray-900">Générer les factures mensuelles</p>
        <p className="mt-1 text-xs text-gray-500">
          Une facture par prestataire, regroupant ses frais validés jusqu&apos;à la fin du mois choisi. Les lignes en
          attente de validation ne sont jamais facturées ; un prestataire sans acceptation des conditions est ignoré.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <div>
            <label className={labelClass}>Mois</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prestataire</label>
            <select value={listingId} onChange={(e) => setListingId(e.target.value)} className={inputClass}>
              <option value="">Tous les prestataires</option>
              {providerOptions.map((p) => (
                <option key={p.listingId} value={p.listingId}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={generating || !month}
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {generating ? 'Génération...' : 'Générer'}
          </button>
        </div>
        {result && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {result.created.length === 0
              ? `Aucun frais validé à facturer jusqu'à fin ${formatMonth(month)}. Validez d'abord les lignes dans la file d'attente.`
              : `${result.created.length} facture(s) générée(s).`}
            {result.skipped.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-rose-700">
                {result.skipped.map((s) => (
                  <li key={s.listingId}>
                    {s.title} : {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="font-semibold text-gray-900">À facturer</p>
        <p className="mt-1 text-xs text-gray-500">Frais validés, pas encore inclus dans une facture.</p>
        {toInvoice.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Aucun frais validé en attente. Le parcours : le prestataire confirme une demande aboutie → vous la
            validez dans la « File d&apos;attente » → elle apparaît ici, prête à être facturée.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-1 font-medium">Prestataire</th>
                  <th className="py-1 text-right font-medium">Lignes</th>
                  <th className="py-1 text-right font-medium">Total</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {toInvoice.map((group) => (
                  <tr key={group.listingId}>
                    <td className="py-2 text-gray-800">
                      {group.title}
                      {!group.termsAccepted && (
                        <span className="ml-2 text-xs font-medium text-rose-600">Conditions non acceptées</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-gray-700">{group.count}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{formatDT(group.total)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleGenerate(group.listingId)}
                        disabled={generating || !group.termsAccepted}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Facturer ({formatMonth(month)})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px] divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Numéro', 'Prestataire', 'Période', 'Montant TTC', 'Échéance', 'Statut', ''].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Aucune facture émise pour l&apos;instant.
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
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
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.listing?.title}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.period}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{formatDT(invoice.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(invoice.dueDate)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${INVOICE_STATUS[invoice.status].className}`}>
                    {INVOICE_STATUS[invoice.status].label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {invoice.status === 'unpaid' && (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatus(invoice, 'cancelled')}
                        disabled={busyId === invoice.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatus(invoice, 'paid')}
                        disabled={busyId === invoice.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Marquer réglée
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ConnectionFeeInvoices;
