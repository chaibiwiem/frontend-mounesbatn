import { useState } from 'react';
import InvoiceBookingSelect, {
  applyBookingToInvoiceForm,
  defaultBookingForClient,
} from './InvoiceBookingSelect';
import InvoiceTotalsSummary from './InvoiceTotalsSummary';
import { computeInvoiceTotals } from '../../utils/invoiceTotals';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

function InvoiceFormModal({ clients, bookings = [], invoicedBookingIds = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: '',
    bookingId: '',
    description: '',
    amount: '',
    taxRate: '',
    deposit: '',
    issuedAt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Choix d'un client : sa reservation (date, description, montant) est
  // selectionnee automatiquement - voir defaultBookingForClient.
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clientId') {
      const booking = value ? defaultBookingForClient(bookings, value, invoicedBookingIds) : null;
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
          'Impossible de créer cette facture.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Émettre une facture</h3>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Document déclaratif. Aucun paiement n'est traité par la plateforme.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Client</label>
            <select name="clientId" value={form.clientId} onChange={handleChange} className={inputClass}>
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
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
            <p className="mt-1 text-xs text-gray-500">
              Facultatif — par défaut : « Prestation — {'{'} nom de votre fiche {'}'} ».
            </p>
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
            <p className="mt-1 text-xs text-gray-500">
              Facultatif — montant déjà réglé par le client (repris de la réservation liée).
            </p>
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
              {submitting ? 'Émission...' : 'Émettre la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceFormModal;
