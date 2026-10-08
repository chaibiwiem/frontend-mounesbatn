import { hasPositivePrice } from '../../utils/rentalPricing';
import { IconX } from '../icons';

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const VEHICLE_TYPE_LABELS = { voiture: 'Voiture', bus: 'Bus', minibus: 'Minibus' };

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-50 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  );
}

// Vue detaillee en lecture seule d'une reservation Transport (VehicleBooking)
// - reprend les memes champs que la demande de location d'origine
// (passagers/chauffeur/decoration via le lead associe), plus les infos de
// reglement declaratives.
function VehicleBookingDetailsModal({ booking, onClose }) {
  const clientName =
    booking.client?.name || (booking.lead ? `${booking.lead.firstName} ${booking.lead.lastName}` : '—');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            Détails de la réservation
            <span
              className={`ml-2 rounded-full px-2.5 py-1 align-middle text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
            >
              {STATUS_LABELS[booking.status]}
            </span>
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <Row label="Client" value={clientName} />
          <Row label="Téléphone" value={booking.client?.phone || booking.lead?.phone} />
          <Row label="Email" value={booking.client?.email || booking.lead?.email} />
          <Row
            label="Véhicule"
            value={
              booking.vehicle
                ? [booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(' ') ||
                  VEHICLE_TYPE_LABELS[booking.vehicle.type]
                : null
            }
          />
          <Row label="Départ" value={formatDateTime(booking.departureDatetime)} />
          <Row label="Retour" value={formatDateTime(booking.returnDatetime)} />
          <Row label="Passagers" value={booking.lead?.passengers} />
          <Row
            label="Chauffeur"
            value={
              booking.lead?.withDriver === null || booking.lead?.withDriver === undefined
                ? null
                : booking.lead.withDriver
                  ? 'Avec chauffeur'
                  : 'Sans chauffeur'
            }
          />
          <Row
            label="Décoration"
            value={
              booking.lead?.decoration
                ? `${booking.lead.decoration.name}${
                    hasPositivePrice(booking.lead.decoration.price) ? ` (${booking.lead.decoration.price} DT)` : ''
                  }`
                : null
            }
          />
          <Row
            label="Options"
            value={
              booking.lead?.selectedOptions?.length > 0
                ? booking.lead.selectedOptions
                    .map((s) => `${s.option?.name}${s.quantity > 1 ? ` x${s.quantity}` : ''}`)
                    .join(', ')
                : null
            }
          />
          <Row label="Lieu de prise en charge" value={booking.lead?.pickupLocation} />
          <Row label="Montant total" value={booking.totalPrice ? `${booking.totalPrice} DT` : null} />
          <Row label="Acompte" value={booking.deposit ? `${booking.deposit} DT` : null} />
          <Row
            label="Règlement"
            value={
              booking.paymentMethod === 'rib' ? 'Virement (RIB)' : booking.paymentMethod === 'cash' ? 'Cash' : null
            }
          />
          {booking.notes && (
            <div className="pt-2">
              <p className="text-sm text-gray-500">Notes privées</p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-900">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleBookingDetailsModal;
