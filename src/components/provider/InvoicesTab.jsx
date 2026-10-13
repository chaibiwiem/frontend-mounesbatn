import { useEffect, useState } from 'react';
import { getClients } from '../../services/clientService';
import { getListingBookings } from '../../services/bookingService';
import { formatDateOnly, formatStay, formatRoomsSummary } from '../../utils/stay';
import { getInvoices, createInvoice, updateInvoice, updateInvoiceStatus, sendInvoice } from '../../services/invoiceService';
import InvoiceFormModal from './InvoiceFormModal';
import InvoiceEditModal from './InvoiceEditModal';
import ConfirmModal from './ConfirmModal';
import { computeInvoiceTotals, formatDt } from '../../utils/invoiceTotals';
import { IconDownload, IconEdit, IconX, IconPlus, IconReceipt, IconSend } from '../icons';
import { openDocument } from '../../services/documentService';

const STATUS_LABELS = { unpaid: 'Non payée', paid: 'Payée', cancelled: 'Annulée' };
const STATUS_COLORS = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function InvoicesTab({ listingId }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [sendingInvoice, setSendingInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesData, clientsData, bookingsData] = await Promise.all([
        getInvoices(),
        getClients(),
        // Reservations facturables : la liste des factures reste utilisable si elles echouent.
        listingId ? getListingBookings(listingId).catch(() => []) : Promise.resolve([]),
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reservations deja facturees (hors factures annulees) : ignorees par la
  // selection automatique de la reservation au choix d'un client.
  const invoicedBookingIds = invoices
    .filter((invoice) => invoice.bookingId && invoice.status !== 'cancelled')
    .map((invoice) => invoice.bookingId);

  const handleCreate = async (form) => {
    await createInvoice(form);
    setShowCreateForm(false);
    await fetchData();
  };

  const handleCancel = async (invoice) => {
    try {
      await updateInvoiceStatus(invoice.id, 'cancelled');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'annuler cette facture.");
    }
  };

  const handleUpdate = async (form) => {
    await updateInvoice(editingInvoice.id, form);
    setEditingInvoice(null);
    await fetchData();
  };

  const openSendConfirm = (invoice) => {
    if (!invoice.client?.email) {
      setError('Ce client n\'a pas d\'adresse email enregistrée.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setSendingInvoice(invoice);
  };

  const handleConfirmSend = async () => {
    await sendInvoice(sendingInvoice.id);
    setSuccessMessage(`Email envoyé à ${sendingInvoice.client.email}.`);
    setSendingInvoice(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Mes factures</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <IconPlus className="h-4 w-4" />
          Émettre une facture
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Numérotation automatique, montants déclaratifs — aucun paiement traité par la plateforme.
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-3 text-sm text-green-600">{successMessage}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <IconReceipt className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Aucune facture pour le moment.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1560px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Numéro</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Réservation</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Montant HT</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">TVA</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Total TTC</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Acompte</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Reste à payer</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Émise le</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{invoice.number}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {invoice.client?.name || 'Client non spécifié'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.client?.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.client?.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {!invoice.booking ? (
                      '—'
                    ) : invoice.booking.checkInDate && invoice.booking.checkOutDate ? (
                      <>
                        <p>{formatStay(invoice.booking.checkInDate, invoice.booking.checkOutDate)}</p>
                        {Array.isArray(invoice.booking.rooms) && invoice.booking.rooms.length > 0 && (
                          <p className="text-xs text-gray-500">{formatRoomsSummary(invoice.booking.rooms)}</p>
                        )}
                        {invoice.booking.guests && (
                          <p className="text-xs text-gray-500">Invités : {invoice.booking.guests}</p>
                        )}
                      </>
                    ) : (
                      `Événement du ${formatDateOnly(invoice.booking.eventDate)}`
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {invoice.amount ? `${invoice.amount} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {invoice.taxRate ? `${invoice.taxRate}%` : 'Sans TVA'}
                  </td>
                  {(() => {
                    const totals = computeInvoiceTotals(invoice);
                    return (
                      <>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                          {formatDt(totals.ttc)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {totals.deposit > 0 ? formatDt(totals.deposit) : '—'}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 font-semibold ${
                            totals.remaining > 0 ? 'text-rose-600' : 'text-green-600'
                          }`}
                        >
                          {formatDt(totals.remaining)}
                        </td>
                      </>
                    );
                  })()}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{invoice.issuedAt || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[invoice.status]}`}
                    >
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={invoice.pdfUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          openDocument(invoice.pdfUrl);
                        }}
                        target="_blank"
                        rel="noreferrer"
                        title="Voir le PDF"
                        aria-label="Voir le PDF"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <IconDownload className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openSendConfirm(invoice)}
                        title="Envoyer par email"
                        aria-label="Envoyer par email"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconSend className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(invoice)}
                        title="Modifier"
                        aria-label="Modifier"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      {invoice.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(invoice)}
                          title="Annuler"
                          aria-label="Annuler"
                          className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateForm && (
        <InvoiceFormModal
          clients={clients}
          bookings={bookings}
          invoicedBookingIds={invoicedBookingIds}
          onSave={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingInvoice && (
        <InvoiceEditModal
          invoice={editingInvoice}
          clients={clients}
          bookings={bookings}
          invoicedBookingIds={invoicedBookingIds}
          onSave={handleUpdate}
          onCancel={() => setEditingInvoice(null)}
        />
      )}

      {sendingInvoice && (
        <ConfirmModal
          title="Envoyer cette facture par email ?"
          description={`La facture ${sendingInvoice.number} sera envoyée à ${sendingInvoice.client.email}.`}
          confirmLabel="Envoyer"
          onConfirm={handleConfirmSend}
          onCancel={() => setSendingInvoice(null)}
        />
      )}
    </div>
  );
}

export default InvoicesTab;
