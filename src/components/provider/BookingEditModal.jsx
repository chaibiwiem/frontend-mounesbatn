import { useState } from 'react';
import PackageSelect from './PackageSelect';
import { GUEST_RANGES, DEFAULT_ROOM, countNights, computeBookingTotal } from '../../utils/stay';
import RoomsEditor from './RoomsEditor';
import StayPricingSummary from './StayPricingSummary';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

// Sejour "Maison d'hote" (Arrivee/Depart + chambres + invites) : memes champs
// que la creation (BookingFormModal), a la place de la date d'evenement unique.
function BookingEditModal({ booking, onSave, onCancel, isAccommodation = false, packages = [] }) {
  const isStay = isAccommodation || Boolean(booking.checkInDate);
  const [form, setForm] = useState({
    eventDate: booking.eventDate || '',
    startTime: booking.startTime ? booking.startTime.slice(0, 5) : '',
    endTime: booking.endTime ? booking.endTime.slice(0, 5) : '',
    totalPrice: booking.totalPrice ?? '',
    deposit: booking.deposit ?? '',
    paymentMethod: booking.paymentMethod || 'cash',
    status: booking.status,
    notes: booking.notes || '',
    checkInDate: booking.checkInDate || booking.eventDate || '',
    checkOutDate: booking.checkOutDate || '',
    guests: booking.guests || '',
    packageId: booking.packageId ? String(booking.packageId) : '',
    servicePrice: booking.servicePrice ?? '',
    discountType: booking.discountType || 'amount',
    discountValue: booking.discountValue ?? '',
  });
  const [rooms, setRooms] = useState(
    Array.isArray(booking.rooms) && booking.rooms.length > 0 ? booking.rooms : [{ ...DEFAULT_ROOM }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Toutes categories : total calcule (chambres x nuits ou prix de la
  // prestation + pack - remise) des qu'un prix est renseigne - sinon montant
  // saisi manuellement.
  const selectedPackage = [booking.package, ...packages].find(
    (pkg) => pkg && String(pkg.id) === String(form.packageId)
  );
  const computedTotal = computeBookingTotal({
    rooms: isStay ? rooms : null,
    checkInDate: isStay ? form.checkInDate : null,
    checkOutDate: isStay ? form.checkOutDate : null,
    servicePrice: isStay ? null : form.servicePrice,
    packagePrice: selectedPackage?.price,
    discountType: form.discountType,
    discountValue: form.discountValue,
  });
  const hasDiscount = Boolean(computedTotal && Number(form.discountValue) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isStay) {
      if (!form.checkInDate || !form.checkOutDate) {
        setError("Les dates d'arrivée et de départ sont requises.");
        return;
      }
      if (form.checkOutDate <= form.checkInDate) {
        setError("La date de départ doit être postérieure à la date d'arrivée.");
        return;
      }
      if (rooms.some((room) => Number(room.adults) < 1)) {
        setError('Chaque chambre doit avoir au moins un adulte.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const dates = isStay
        ? {
            eventDate: form.checkInDate,
            checkInDate: form.checkInDate,
            checkOutDate: form.checkOutDate,
            rooms,
            guests: form.guests || null,
          }
        : {
            eventDate: form.eventDate || null,
            startTime: form.startTime || null,
            endTime: form.endTime || null,
            servicePrice: Number(form.servicePrice) > 0 ? form.servicePrice : null,
          };
      await onSave({
        ...dates,
        discountType: hasDiscount ? form.discountType : null,
        discountValue: hasDiscount ? form.discountValue : null,
        totalPrice: computedTotal ? computedTotal.total : form.totalPrice === '' ? null : form.totalPrice,
        packageId: form.packageId || null,
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
        <p className="mt-1 text-sm text-gray-500">{booking.client?.name}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isStay && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Arrivée *</label>
                  <input required type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Départ *</label>
                  <input required
                    type="date"
                    name="checkOutDate"
                    min={form.checkInDate || undefined}
                    value={form.checkOutDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              {countNights(form.checkInDate, form.checkOutDate) > 0 && (
                <p className="text-xs text-gray-500">
                  {countNights(form.checkInDate, form.checkOutDate)} nuit
                  {countNights(form.checkInDate, form.checkOutDate) > 1 ? 's' : ''}
                </p>
              )}
              <div>
                <p className={labelClass}>Chambre et occupation</p>
                <div className="mt-1">
                  <RoomsEditor rooms={rooms} onChange={setRooms} withPrice />
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Nombre d&apos;invités <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <select name="guests" value={form.guests} onChange={handleChange} className={inputClass}>
                  <option value="">Sélectionner...</option>
                  {GUEST_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!isStay && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Date de l'événement</label>
              <input
                type="date"
                name="eventDate"
                value={form.eventDate || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Heure de début</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Heure de fin</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          )}

          <PackageSelect
            packages={packages}
            current={booking.package}
            value={form.packageId}
            onChange={(pkg) => setForm((prev) => ({ ...prev, packageId: pkg ? String(pkg.id) : '' }))}
          />

          <StayPricingSummary
            totals={computedTotal}
            isStay={isStay}
            servicePrice={form.servicePrice}
            discountType={form.discountType}
            discountValue={form.discountValue}
            onChange={(changes) => setForm((prev) => ({ ...prev, ...changes }))}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="totalPrice"
                value={computedTotal ? computedTotal.total : form.totalPrice}
                onChange={handleChange}
                readOnly={Boolean(computedTotal)}
                title={computedTotal ? 'Calculé automatiquement' : undefined}
                className={`${inputClass} ${computedTotal ? 'bg-gray-50 font-semibold' : ''}`}
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

export default BookingEditModal;
