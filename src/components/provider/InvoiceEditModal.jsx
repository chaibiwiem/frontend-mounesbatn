import { useState } from 'react';
import { sendInvoice } from '../../services/invoiceService';
import { IconSend } from '../icons';
import InvoiceBookingSelect, {
  applyBookingToInvoiceForm,
  defaultBookingForClient,
} from './InvoiceBookingSelect';
import InvoiceTotalsSummary from './InvoiceTotalsSummary';
import { computeInvoiceTotals } from '../../utils/invoiceTotals';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Non payée' },
  { value: 'paid', label: 'Payée' },
  { value: 'cancelled', label: 'Annulée' },
];

function InvoiceEditModal({ invoice, clients, bookings = [], invoicedBookingIds = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: invoice.clientId || '',
    bookingId: invoice.bookingId || '',
    description: invoice.description || '',
    amount: invoice.amount ?? '',
    taxRate: invoice.taxRate ? String(Number(invoice.taxRate)) : '',
    deposit: invoice.deposit ? String(Number(invoice.deposit)) : '',
    issuedAt: invoice.issuedAt || '',
    status: invoice.status,
  });
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  // Choix d'un client : sa reservation (date, description, montant) est
  // selectionnee automatiquement - la reservation deja liee a CETTE facture
  // ne compte pas comme "deja facturee".
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clientId') {
      const otherInvoiced = invoicedBookingIds.filter((id) => String(id) !== String(invoice.bookingId));
      const booking = value ? defaultBookingForClient(bookings, value, otherInvoiced) : null;
      setForm((prev) => applyBookingToInvoiceForm({ ...prev, clientId: value }, booking, bookings));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Reservation choisie : pre-remplit client, description (sejour) et montant.
  const handleBookingChange = (booking) => {
    setForm((prev) => applyBookingToInvoiceForm(prev, booking, bookings));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount) {
      setError('Le montant est requis.');
      return;
    }
    if (computeInvoiceTotals(form).depositTooHigh) {
      setError("L'acompte ne peut pas dépasser le total TTC.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de mettre à jour cette facture.'
      );
      setSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setError('');
    setSendMessage('');
    try {
      await sendInvoice(invoice.id);
      setSendMessage('Facture envoyée au client par email.');
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer cette facture.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier la facture</h3>
        <p className="mt-1 text-sm text-gray-500">{invoice.number}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Client</label>
            <select name="clientId" value={form.clientId} onChange={handleChange} className={inputClass}>
              <option value="">Sélectionner un client...</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <InvoiceBookingSelect
            bookings={bookings}
            clientId={form.clientId}
            value={form.bookingId}
            onChange={handleBookingChange}
          />

          <div>
            <label className={labelClass}>Description de la prestation</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="ex : DJ + sonorisation - mariage du 12/09"
              maxLength={255}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Montant HT (DT) *</label>
            <input required
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-800">Ajouter la TVA (19%)</p>
              <p className="text-xs text-gray-500">Facultatif — laissez décoché pour une facture sans TVA.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.taxRate === '19'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, taxRate: e.target.checked ? '19' : '' }))
                }
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-rose-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
            </label>
          </div>

          <div>
            <label className={labelClass}>Acompte versé (DT)</label>
            <input
              type="number"
              name="deposit"
              min="0"
              value={form.deposit}
              onChange={handleChange}
              placeholder="0"
              className={inputClass}
            />
          </div>

          <InvoiceTotalsSummary amount={form.amount} taxRate={form.taxRate} deposit={form.deposit} />

          <div>
            <label className={labelClass}>Date d'émission</label>
            <input
              type="date"
              name="issuedAt"
              value={form.issuedAt}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <IconSend className="h-4 w-4" />
            {sending ? 'Envoi...' : 'Envoyer cette facture au client par email'}
          </button>
          {sendMessage && <p className="text-sm text-green-600">{sendMessage}</p>}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceEditModal;
