import { useState } from 'react';
import { estimateRentalPrice, hasPositivePrice } from '../../utils/rentalPricing';
import { formatTunisianPhone, stripPhoneSpaces } from '../../utils/phone';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500';
const labelClass = 'block text-xs font-medium text-gray-700';

function VehicleBookingModal({ vehicle, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    departureDatetime: '',
    returnDatetime: '',
    decorationId: '',
    totalPrice: '',
    paymentMethod: 'cash',
    notes: '',
  });
  // Le montant est recalcule automatiquement (jours x prix/jour, + prix du
  // modele de decoration choisi) tant que le prestataire n'a pas saisi
  // lui-meme une valeur dans le champ Montant.
  const [priceEdited, setPriceEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedDecoration = vehicle?.decorations?.find((d) => String(d.id) === form.decorationId) || null;
  const estimate = estimateRentalPrice(form.departureDatetime, form.returnDatetime, vehicle, selectedDecoration);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'totalPrice') {
      setPriceEdited(true);
      setForm((prev) => ({ ...prev, totalPrice: value }));
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: name === 'clientPhone' ? formatTunisianPhone(value) : value };
      if (
        !priceEdited &&
        (name === 'departureDatetime' || name === 'returnDatetime' || name === 'decorationId')
      ) {
        const nextDecoration = vehicle?.decorations?.find((d) => String(d.id) === next.decorationId) || null;
        const nextEstimate = estimateRentalPrice(
          next.departureDatetime,
          next.returnDatetime,
          vehicle,
          nextDecoration
        );
        next.totalPrice = nextEstimate ? String(nextEstimate.amount) : '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.clientName.trim()) {
      setError('Le nom du client est requis.');
      return;
    }
    if (!form.departureDatetime || !form.returnDatetime) {
      setError('Les dates de départ et de retour sont requises.');
      return;
    }
    if (new Date(form.returnDatetime) <= new Date(form.departureDatetime)) {
      setError('La date de retour doit être postérieure à la date de départ.');
      return;
    }

    const payload = {
      clientName: form.clientName,
      departureDatetime: form.departureDatetime,
      returnDatetime: form.returnDatetime,
      totalPrice: form.totalPrice || undefined,
      paymentMethod: form.paymentMethod || undefined,
      notes: form.notes || undefined,
    };
    if (form.clientEmail) payload.clientEmail = form.clientEmail;
    if (form.clientPhone) payload.clientPhone = stripPhoneSpaces(form.clientPhone);

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer cette location."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          Enregistrer une location
          {vehicle && (
            <span className="block text-sm font-normal text-gray-500">
              {vehicle.brand} {vehicle.model} ({vehicle.type})
            </span>
          )}
        </h3>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Enregistrement d'un accord conclu en direct. Aucun paiement n'est traité par la
          plateforme.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Nom du client *</label>
              <input required name="clientName" value={form.clientName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="clientEmail"
                value={form.clientEmail}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                type="tel"
                pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
                inputMode="tel"
                autoComplete="tel"
                name="clientPhone"
                value={form.clientPhone}
                onChange={handleChange}
                placeholder="+216 20 123 456"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Départ *</label>
              <input required
                type="datetime-local"
                name="departureDatetime"
                value={form.departureDatetime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Retour *</label>
              <input required
                type="datetime-local"
                name="returnDatetime"
                value={form.returnDatetime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {vehicle?.hasDecoration && vehicle.decorations?.length > 0 && (
            <div>
              <label className={labelClass}>Décoration</label>
              <select name="decorationId" value={form.decorationId} onChange={handleChange} className={inputClass}>
                <option value="">Aucune</option>
                {vehicle.decorations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {hasPositivePrice(d.price) ? ` (${d.price} DT)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="totalPrice"
                min="0"
                value={form.totalPrice}
                onChange={handleChange}
                className={inputClass}
              />
              {hasPositivePrice(vehicle?.pricePerDay) ||
              hasPositivePrice(vehicle?.pricePerHour) ||
              hasPositivePrice(selectedDecoration?.price) ? (
                estimate ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {estimate.unit && (
                      <>
                        {estimate.quantity} {estimate.unit}
                        {estimate.quantity > 1 ? 's' : ''} × {estimate.rate} DT/
                        {estimate.unit === 'heure' ? 'h' : 'j'}
                        {estimate.decorationAmount > 0 ? ` + ${estimate.decorationAmount} DT décoration` : ''} ={' '}
                      </>
                    )}
                    {estimate.amount} DT
                    {priceEdited && Number(form.totalPrice) !== estimate.amount && (
                      <button
                        type="button"
                        onClick={() => {
                          setPriceEdited(false);
                          setForm((prev) => ({ ...prev, totalPrice: String(estimate.amount) }));
                        }}
                        className="ml-1 font-semibold text-rose-600 hover:underline"
                      >
                        Utiliser ce montant
                      </button>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Renseignez les dates pour calculer le montant automatiquement.
                  </p>
                )
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Mode de règlement</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className={inputClass}>
                <option value="cash">Cash</option>
                <option value="rib">Virement (RIB)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes privées</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputClass} />
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

export default VehicleBookingModal;
