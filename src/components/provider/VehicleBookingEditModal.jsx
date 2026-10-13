import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

// datetime-local attend 'YYYY-MM-DDTHH:mm' sans fuseau - on tronque la valeur
// ISO renvoyee par l'API (qui inclut secondes/millisecondes/Z).
const toLocalInputValue = (value) => (value ? value.slice(0, 16) : '');

function VehicleBookingEditModal({ booking, onSave, onCancel }) {
  const [form, setForm] = useState({
    departureDatetime: toLocalInputValue(booking.departureDatetime),
    returnDatetime: toLocalInputValue(booking.returnDatetime),
    totalPrice: booking.totalPrice ?? '',
    deposit: booking.deposit ?? '',
    paymentMethod: booking.paymentMethod || 'cash',
    status: booking.status,
    notes: booking.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(form.returnDatetime) <= new Date(form.departureDatetime)) {
      setError('La date de retour doit être postérieure à la date de départ.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        departureDatetime: form.departureDatetime,
        returnDatetime: form.returnDatetime,
        totalPrice: form.totalPrice === '' ? null : form.totalPrice,
        deposit: form.deposit === '' ? null : form.deposit,
        paymentMethod: form.paymentMethod || null,
        status: form.status,
        notes: form.notes,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de mettre à jour cette réservation.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier la réservation</h3>
        <p className="mt-1 text-sm text-gray-500">
          {booking.client?.name || (booking.lead ? `${booking.lead.firstName} ${booking.lead.lastName}` : '')}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Départ</label>
              <input
                type="datetime-local"
                name="departureDatetime"
                value={form.departureDatetime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Retour</label>
              <input
                type="datetime-local"
                name="returnDatetime"
                value={form.returnDatetime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="totalPrice"
                value={form.totalPrice}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Acompte (DT)</label>
              <input
                type="number"
                name="deposit"
                value={form.deposit}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mode de règlement</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="cash">Cash</option>
                <option value="rib">Virement (RIB)</option>
              </select>
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
          </div>

          <div>
            <label className={labelClass}>Notes privées</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
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
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleBookingEditModal;
