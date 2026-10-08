import { useState } from 'react';
import { estimateRentalPrice } from '../../utils/rentalPricing';
import { GUEST_RANGES, DEFAULT_ROOM, countNights, computeBookingTotal } from '../../utils/stay';
import RoomsEditor from './RoomsEditor';
import PackageSelect from './PackageSelect';
import StayPricingSummary from './StayPricingSummary';
import { formatDT, formatFeeRate } from '../../services/connectionFeeService';
import { formatTunisianPhone, stripPhoneSpaces } from '../../utils/phone';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500';
const labelClass = 'block text-xs font-medium text-gray-700';

// `isAccommodation` : prestataire "Maison d'hote" - la reservation porte un
// sejour (Arrivee/Depart + chambres + invites, memes champs que la demande)
// au lieu d'une date d'evenement unique. Aussi deduit d'une demande de sejour.
function BookingFormModal({
  lead,
  initialDate,
  onSave,
  onCancel,
  isAccommodation = false,
  packages = [],
  // Frais de mise en relation (M13) de la fiche - voir LeadsTab.
  connectionFee = null,
}) {
  const isStay = isAccommodation || Boolean(lead?.checkInDate);
  // Demande de location Transport : le prix se deduit des dates + du tarif
  // (heure ou jour) du vehicule choisi, plutot que d'une saisie manuelle a vide.
  const estimate = lead
    ? estimateRentalPrice(
        lead.departureDatetime,
        lead.returnDatetime,
        lead.vehicle,
        lead.decoration,
        lead.selectedOptions
      )
    : null;

  const [form, setForm] = useState({
    clientName: lead ? `${lead.firstName} ${lead.lastName}` : '',
    clientEmail: lead ? lead.email || '' : '',
    clientPhone: lead?.phone ? formatTunisianPhone(lead.phone) : '',
    eventDate: lead?.eventDate || initialDate || '',
    startTime: '',
    endTime: '',
    // Montant : estimation location (Transport), sinon prix du pack demande.
    totalPrice: estimate
      ? String(estimate.amount)
      : Number(lead?.package?.price) > 0
        ? String(lead.package.price)
        : '',
    packageId: lead?.packageId ? String(lead.packageId) : '',
    deposit: '',
    paymentMethod: 'cash',
    notes: '',
    checkInDate: lead?.checkInDate || initialDate || '',
    checkOutDate: lead?.checkOutDate || '',
    guests: lead?.guests || '',
    servicePrice: '',
    discountType: 'amount',
    discountValue: '',
  });
  const [rooms, setRooms] = useState(
    Array.isArray(lead?.rooms) && lead.rooms.length > 0 ? lead.rooms : [{ ...DEFAULT_ROOM }]
  );
  const [priceEdited, setPriceEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalPrice') setPriceEdited(true);
    setForm((prev) => ({ ...prev, [name]: name === 'clientPhone' ? formatTunisianPhone(value) : value }));
  };

  // Pack choisi : son prix pre-remplit le montant tant que le prestataire ne
  // l'a pas saisi lui-meme (et hors estimation location).
  const handlePackageChange = (pkg) => {
    setForm((prev) => ({
      ...prev,
      packageId: pkg ? String(pkg.id) : '',
      totalPrice:
        !priceEdited && !estimate ? (Number(pkg?.price) > 0 ? String(pkg.price) : '') : prev.totalPrice,
    }));
  };

  // Toutes categories (hors location de vehicule, qui a sa propre estimation) :
  // total calcule (chambres x nuits ou prix de la prestation + pack - remise)
  // des qu'un prix est renseigne - sinon montant saisi manuellement.
  const pricingEnabled = !lead?.vehicleId;
  const selectedPackage = [lead?.package, ...packages].find(
    (pkg) => pkg && String(pkg.id) === String(form.packageId)
  );
  const computedTotal = pricingEnabled
    ? computeBookingTotal({
        rooms: isStay ? rooms : null,
        checkInDate: isStay ? form.checkInDate : null,
        checkOutDate: isStay ? form.checkOutDate : null,
        servicePrice: isStay ? null : form.servicePrice,
        packagePrice: selectedPackage?.price,
        discountType: form.discountType,
        discountValue: form.discountValue,
      })
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.clientName.trim()) {
      setError('Le nom du client est requis.');
      return;
    }

    const payload = {
      clientName: form.clientName,
      totalPrice: computedTotal ? computedTotal.total : form.totalPrice || undefined,
      deposit: form.deposit || undefined,
      paymentMethod: form.paymentMethod || undefined,
      notes: form.notes || undefined,
    };
    if (form.clientEmail) payload.clientEmail = form.clientEmail;
    if (form.clientPhone) payload.clientPhone = stripPhoneSpaces(form.clientPhone);
    if (lead) payload.leadId = lead.id;

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

    // Demande de location Transport avec vehicule choisi : reservation
    // enregistree comme VehicleBooking (periode depart/retour, anti-
    // chevauchement) plutot que Booking generique (date d'evenement unique) -
    // voir LeadsTab.handleCreateBookingFromLead, qui route vers le bon
    // endpoint selon la presence de vehicleId.
    if (lead?.vehicleId) {
      payload.vehicleId = lead.vehicleId;
      payload.departureDatetime = lead.departureDatetime;
      payload.returnDatetime = lead.returnDatetime;
    } else if (isStay) {
      payload.checkInDate = form.checkInDate;
      payload.checkOutDate = form.checkOutDate;
      payload.eventDate = form.checkInDate;
      payload.rooms = rooms;
      payload.guests = form.guests || undefined;
    } else {
      payload.eventDate = form.eventDate || undefined;
      payload.startTime = form.startTime || undefined;
      payload.endTime = form.endTime || undefined;
    }
    // Pack, prix de la prestation et remise (reservation generique uniquement,
    // pas une location de vehicule).
    if (pricingEnabled) {
      payload.packageId = form.packageId || null;
      if (!isStay && Number(form.servicePrice) > 0) payload.servicePrice = form.servicePrice;
      if (computedTotal && Number(form.discountValue) > 0) {
        payload.discountType = form.discountType;
        payload.discountValue = form.discountValue;
      }
    }

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer cette réservation."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Enregistrer une réservation</h3>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Enregistrement d'un accord conclu en direct. Aucun paiement n'est traité par la
          plateforme.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {lead && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Réservation liée à la demande de{' '}
              <span className="font-medium text-gray-900">
                {lead.firstName} {lead.lastName}
              </span>
              . Cette demande passera au statut « Confirmées ».
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Nom du client *</label>
              <input required
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                disabled={Boolean(lead)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="clientEmail"
                value={form.clientEmail}
                onChange={handleChange}
                disabled={Boolean(lead)}
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
                disabled={Boolean(lead)}
                className={inputClass}
              />
            </div>
          </div>

          {lead?.departureDatetime && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Location du {new Date(lead.departureDatetime).toLocaleString('fr-FR')} au{' '}
              {new Date(lead.returnDatetime).toLocaleString('fr-FR')}
              {lead.decoration && ` · Décoration : ${lead.decoration.name}`}
              {lead.selectedOptions?.length > 0 &&
                ` · Options : ${lead.selectedOptions
                  .map((s) => `${s.option?.name}${s.quantity > 1 ? ` x${s.quantity}` : ''}`)
                  .join(', ')}`}
            </div>
          )}

          {isStay && !lead?.departureDatetime && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Arrivée *</label>
                  <input required
                    type="date"
                    name="checkInDate"
                    value={form.checkInDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
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

          {!isStay && !lead?.departureDatetime && (
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

          {!lead?.vehicleId && (
            <PackageSelect
              packages={packages}
              current={lead?.package}
              value={form.packageId}
              onChange={handlePackageChange}
            />
          )}

          {pricingEnabled && (
            <StayPricingSummary
              totals={computedTotal}
              isStay={isStay}
              servicePrice={form.servicePrice}
              discountType={form.discountType}
              discountValue={form.discountValue}
              onChange={(changes) => setForm((prev) => ({ ...prev, ...changes }))}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="totalPrice"
                value={computedTotal ? computedTotal.total : form.totalPrice}
                onChange={handleChange}
                readOnly={Boolean(computedTotal)}
                className={`${inputClass} ${computedTotal ? 'bg-gray-50 font-semibold' : ''}`}
              />
              {computedTotal && <p className="mt-1 text-xs text-gray-500">Calculé automatiquement.</p>}
              {estimate && (
                <p className="mt-1 text-xs text-gray-500">
                  {estimate.unit && (
                    <>
                      {estimate.quantity} {estimate.unit}
                      {estimate.quantity > 1 ? 's' : ''} × {estimate.rate} DT/
                      {estimate.unit === 'heure' ? 'h' : 'j'}
                      {estimate.decorationAmount > 0 ? ` + ${estimate.decorationAmount} DT décoration` : ''}
                      {estimate.optionsAmount > 0 ? ` + ${estimate.optionsAmount} DT options` : ''} ={' '}
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
              )}
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
            <label className={labelClass}>Notes privées</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Frais de mise en relation (M13) : declares automatiquement a
              l'enregistrement d'une reservation issue d'une demande. */}
          {lead && connectionFee?.concerned && !lead.commission && (() => {
            const contractAmount = Number(computedTotal ? computedTotal.total : form.totalPrice) || 0;
            const isPercent = connectionFee.type === 'percent';
            const feeAmount = isPercent
              ? contractAmount > 0
                ? Math.round(contractAmount * Number(connectionFee.value)) / 100
                : null
              : connectionFee.amount;
            return (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-gray-700">
                <p className="font-semibold text-gray-900">
                  Frais de mise en relation : {formatFeeRate(connectionFee)}
                  {feeAmount !== null && ` = ${formatDT(feeAmount)}`}
                </p>
                {!connectionFee.termsAccepted ? (
                  <p className="mt-0.5">Acceptez d&apos;abord les conditions des frais de mise en relation (bandeau en haut de page).</p>
                ) : feeAmount === null ? (
                  <p className="mt-0.5">
                    Renseignez le montant total pour que les frais soient déclarés automatiquement.
                  </p>
                ) : (
                  <p className="mt-0.5">
                    Déclarés automatiquement à l&apos;enregistrement, puis validés par Mounesba. Aucun paiement sur
                    la plateforme : facture mensuelle réglée hors ligne.
                  </p>
                )}
              </div>
            );
          })()}

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

export default BookingFormModal;
