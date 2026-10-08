import { useEffect, useState } from 'react';
import {
  getSubscriptionInvoices,
  deleteSubscriptionInvoice,
  sendSubscriptionInvoice,
} from '../../services/adminService';
import SubscriptionInvoiceForm from './SubscriptionInvoiceForm';
import ConfirmModal from './ConfirmModal';
import { IconDownload, IconEdit, IconTrash, IconSend } from '../icons';
import { formatDateOnly } from '../../utils/stay';
import { openDocument } from '../../services/documentService';

const STATUS_LABELS = { unpaid: 'Non payée', paid: 'Payée', cancelled: 'Annulée' };

const STATUS_COLORS = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function SubscriptionInvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [sendingInvoice, setSendingInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubscriptionInvoices({ status: status || undefined, page });
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleConfirmDelete = async () => {
    await deleteSubscriptionInvoice(deletingInvoice.id);
    setDeletingInvoice(null);
    await fetchInvoices();
  };

  const openSendConfirm = (invoice) => {
    const provider = invoice.subscription?.provider;
    if (!provider?.email) {
      setError("Ce prestataire n'a pas d'adresse email enregistrée.");
      return;
    }
    setError('');
    setSuccessMessage('');
    setSendingInvoice(invoice);
  };

  const handleConfirmSend = async () => {
    await sendSubscriptionInvoice(sendingInvoice.id);
    setSuccessMessage(`Facture envoyée à ${sendingInvoice.subscription.provider.email}.`);
    setSendingInvoice(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">Tous les statuts</option>
          <option value="unpaid">Non payée</option>
          <option value="paid">Payée</option>
          <option value="cancelled">Annulée</option>
        </select>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{pagination.total} facture(s)</span>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-3 text-sm text-green-600">{successMessage}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : invoices.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucune facture.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">N° Facture</th>
                <th className="px-4 py-3">Prestataire</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Émission</th>
                <th className="px-4 py-3">Échéance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => {
                const provider = invoice.subscription?.provider;
                return (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {provider ? `${provider.firstName} ${provider.lastName}` : '—'}
                      {provider?.email && <div className="text-xs text-gray-400">{provider.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-rose-600">
                      <span className="whitespace-nowrap">{Number(invoice.amount).toFixed(2)} DT</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {invoice.periodStart
                        ? `${formatDateOnly(invoice.periodStart)} → ${invoice.periodEnd ? formatDateOnly(invoice.periodEnd) : '…'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[invoice.status]}`}
                      >
                        {STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateOnly(invoice.issuedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateOnly(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            onClick={(e) => {
                              e.preventDefault();
                              openDocument(invoice.pdfUrl);
                            }}
                            target="_blank"
                            rel="noreferrer"
                            title="Télécharger"
                            aria-label="Télécharger"
                            className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                          >
                            <IconDownload className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openSendConfirm(invoice)}
                          title="Envoyer par email"
                          aria-label="Envoyer par email"
                          className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                        >
                          <IconSend className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingInvoice(invoice)}
                          title="Modifier"
                          aria-label="Modifier"
                          className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingInvoice(invoice)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-600 hover:text-white"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-gray-500">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      {formOpen && (
        <SubscriptionInvoiceForm
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            fetchInvoices();
          }}
        />
      )}

      {editingInvoice && (
        <SubscriptionInvoiceForm
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSuccess={() => {
            setEditingInvoice(null);
            fetchInvoices();
          }}
        />
      )}

      {deletingInvoice && (
        <ConfirmModal
          title={`Supprimer la facture "${deletingInvoice.number}" ?`}
          description="Cette action est définitive."
          confirmLabel="Supprimer"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingInvoice(null)}
        />
      )}

      {sendingInvoice && (
        <ConfirmModal
          title="Envoyer cette facture par email ?"
          description={`La facture ${sendingInvoice.number} sera envoyée à ${sendingInvoice.subscription.provider.email}.`}
          confirmLabel="Envoyer"
          onConfirm={handleConfirmSend}
          onCancel={() => setSendingInvoice(null)}
        />
      )}
    </div>
  );
}

export default SubscriptionInvoicesTab;
