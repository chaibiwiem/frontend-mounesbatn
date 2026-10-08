import { useEffect, useState } from 'react';
import { getVehicleBookings, updateVehicleBookingStatus } from '../../services/vehicleService';
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

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Periodes reservees pour un vehicule (departure/return, anti-chevauchement
// avec les futures demandes - voir leadController.createLead), affichees ici
// pour que le prestataire visualise sa disponibilite au lieu de la deviner.
function VehicleReservationsModal({ vehicle, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getVehicleBookings(vehicle.id)
      .then(setBookings)
      .catch(() => setError('Impossible de charger les réservations.'))
      .finally(() => setLoading(false));
  }, [vehicle.id]);

  const handleCancel = async (bookingId) => {
    setUpdatingId(bookingId);
    try {
      const updated = await updateVehicleBookingStatus(bookingId, 'cancelled');
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cette réservation.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            Réservations
            <span className="block text-sm font-normal text-gray-500">
              {vehicle.brand} {vehicle.model}
            </span>
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune réservation enregistrée pour ce véhicule.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.client?.name || booking.lead?.firstName
                          ? `${booking.lead?.firstName || ''} ${booking.lead?.lastName || ''}`.trim() ||
                            booking.client?.name
                          : 'Client sans nom'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Du {formatDateTime(booking.departureDatetime)} au{' '}
                        {formatDateTime(booking.returnDatetime)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">
                      {booking.totalPrice ? `${booking.totalPrice} DT` : 'Montant sur devis'}
                      {booking.deposit ? ` · Acompte ${booking.deposit} DT` : ''}
                    </p>
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleReservationsModal;
