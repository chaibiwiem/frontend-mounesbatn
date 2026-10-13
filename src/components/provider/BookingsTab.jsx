import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getListingBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
} from '../../services/bookingService';
import {
  getListingVehicleBookings,
  updateVehicleBooking,
  updateVehicleBookingStatus,
} from '../../services/vehicleService';
import { hasPositivePrice } from '../../utils/rentalPricing';
import BookingFormModal from './BookingFormModal';
import { formatDateOnly, countNights, formatRoomsSummary } from '../../utils/stay';
import { formatPackage } from '../../utils/packages';
import useMyPackages from '../../hooks/useMyPackages';
import BookingEditModal from './BookingEditModal';
import VehicleBookingEditModal from './VehicleBookingEditModal';
import VehicleBookingDetailsModal from './VehicleBookingDetailsModal';
import ConfirmModal from './ConfirmModal';
import { IconPlus, IconEdit, IconCalendar, IconX, IconEye } from '../icons';

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

function BookingsTab({ listingId, isTransportProvider, isAccommodationProvider = false }) {
  const packages = useMyPackages();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingVehicleBooking, setEditingVehicleBooking] = useState(null);
  const [viewingVehicleBooking, setViewingVehicleBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancellingVehicleBooking, setCancellingVehicleBooking] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = isTransportProvider
        ? await getListingVehicleBookings(listingId)
        : await getListingBookings(listingId);
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  }, [listingId, isTransportProvider]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCreate = async (payload) => {
    await createBooking(payload);
    setShowCreateForm(false);
    await fetchBookings();
  };

  const handleUpdate = async (payload) => {
    await updateBooking(editingBooking.id, payload);
    setEditingBooking(null);
    await fetchBookings();
  };

  const handleConfirmCancelVehicleBooking = async () => {
    const bookingId = cancellingVehicleBooking.id;
    const updated = await updateVehicleBookingStatus(bookingId, 'cancelled');
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    setCancellingVehicleBooking(null);
  };

  const handleConfirmCancelBooking = async () => {
    await updateBookingStatus(cancellingBooking.id, 'cancelled');
    setCancellingBooking(null);
    await fetchBookings();
  };

  const handleUpdateVehicleBooking = async (payload) => {
    const updated = await updateVehicleBooking(editingVehicleBooking.id, payload);
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingVehicleBooking(null);
  };

  // Filtre Date : reservation generique -> eventDate (jour unique) ; location
  // vehicule (Transport) -> plage depart/retour, la date filtree doit tomber
  // dedans (une location dure plusieurs jours, pas juste le jour de depart).
  const matchesDateFilter = (booking) => {
    if (!dateFilter) return true;
    if (isTransportProvider) {
      const departureDate = booking.departureDatetime?.slice(0, 10);
      const returnDate = booking.returnDatetime?.slice(0, 10);
      if (!departureDate || !returnDate) return false;
      return dateFilter >= departureDate && dateFilter <= returnDate;
    }
    // Sejour : la date filtree tombe pendant une nuit [arrivee, depart[.
    if (booking.checkInDate && booking.checkOutDate) {
      return dateFilter >= booking.checkInDate && dateFilter < booking.checkOutDate;
    }
    return booking.eventDate === dateFilter;
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => (!statusFilter || booking.status === statusFilter) && matchesDateFilter(booking)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, statusFilter, dateFilter, isTransportProvider]
  );

  const hasActiveFilters = Boolean(dateFilter || statusFilter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Réservations</h2>
        {!isTransportProvider && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <IconPlus className="h-4 w-4" />
            Enregistrer une réservation
          </button>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {isTransportProvider
          ? "Ces réservations sont liées au calendrier et à la disponibilité de chaque véhicule (période départ/retour) — aucun paiement n'est traité par la plateforme, les montants affichés sont déclaratifs. Pour enregistrer une nouvelle location, utilisez « Ma flotte »."
          : "Ces réservations sont des accords conclus en direct entre vous et vos clients. Aucun paiement n'est traité par la plateforme — les montants affichés sont déclaratifs."}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {bookings.length > 0 && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-rose-600"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <IconCalendar className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Aucune réservation enregistrée pour le moment.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <IconCalendar className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Aucune réservation ne correspond à ces filtres.</p>
        </div>
      ) : isTransportProvider ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1700px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Véhicule</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Départ</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Retour</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Passagers</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Chauffeur</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Décoration</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Options</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Montant total</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Acompte</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Règlement</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {booking.client?.name ||
                      (booking.lead ? `${booking.lead.firstName} ${booking.lead.lastName}` : '—')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.client?.phone || booking.lead?.phone || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.client?.email || booking.lead?.email || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.vehicle
                      ? [booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(' ') ||
                        VEHICLE_TYPE_LABELS[booking.vehicle.type]
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatDateTime(booking.departureDatetime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatDateTime(booking.returnDatetime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{booking.lead?.passengers || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.lead?.withDriver === null || booking.lead?.withDriver === undefined
                      ? '—'
                      : booking.lead.withDriver
                        ? 'Avec chauffeur'
                        : 'Sans chauffeur'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.lead?.decoration
                      ? `${booking.lead.decoration.name}${
                          hasPositivePrice(booking.lead.decoration.price)
                            ? ` (${booking.lead.decoration.price} DT)`
                            : ''
                        }`
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.lead?.selectedOptions?.length > 0
                      ? booking.lead.selectedOptions
                          .map((s) => `${s.option?.name}${s.quantity > 1 ? ` x${s.quantity}` : ''}`)
                          .join(', ')
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.totalPrice ? `${booking.totalPrice} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.deposit ? `${booking.deposit} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.paymentMethod === 'rib'
                      ? 'Virement (RIB)'
                      : booking.paymentMethod === 'cash'
                        ? 'Cash'
                        : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingVehicleBooking(booking)}
                        title="Voir les détails"
                        aria-label="Voir les détails"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconEye className="h-4 w-4" />
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingVehicleBooking(booking)}
                            title="Modifier"
                            aria-label="Modifier"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingVehicleBooking(booking)}
                            title="Annuler"
                            aria-label="Annuler"
                            className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <IconX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table
            className={`w-full divide-y divide-gray-100 text-sm ${
              isAccommodationProvider ? 'min-w-[1700px]' : 'min-w-[1340px]'
            }`}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Compte</th>
                {isAccommodationProvider ? (
                  <>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Arrivée</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Départ</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nuits</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Chambres et occupation
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Invités</th>
                  </>
                ) : (
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                )}
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Pack choisi</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Montant total</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Acompte</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Règlement</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {booking.client?.name || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{booking.client?.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{booking.client?.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {booking.leadId ? (
                      <span
                        className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                        title="Issue d'une demande de devis en ligne"
                      >
                        Plateforme
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400" title="Créée manuellement par le prestataire">
                        Hors plateforme
                      </span>
                    )}
                  </td>
                  {isAccommodationProvider ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateOnly(booking.checkInDate || booking.eventDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(booking.checkOutDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {countNights(booking.checkInDate, booking.checkOutDate) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatRoomsSummary(booking.rooms)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{booking.guests || '—'}</td>
                    </>
                  ) : (
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{booking.eventDate || '—'}</td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatPackage(booking.package)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.totalPrice ? `${booking.totalPrice} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.deposit ? `${booking.deposit} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {booking.paymentMethod === 'rib'
                      ? 'Virement (RIB)'
                      : booking.paymentMethod === 'cash'
                        ? 'Cash'
                        : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingBooking(booking)}
                        title="Modifier"
                        aria-label="Modifier"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      {booking.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setCancellingBooking(booking)}
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
        <BookingFormModal
          isAccommodation={isAccommodationProvider}
          packages={packages}
          onSave={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          isAccommodation={isAccommodationProvider}
          packages={packages}
          onSave={handleUpdate}
          onCancel={() => setEditingBooking(null)}
        />
      )}

      {editingVehicleBooking && (
        <VehicleBookingEditModal
          booking={editingVehicleBooking}
          onSave={handleUpdateVehicleBooking}
          onCancel={() => setEditingVehicleBooking(null)}
        />
      )}

      {viewingVehicleBooking && (
        <VehicleBookingDetailsModal
          booking={viewingVehicleBooking}
          onClose={() => setViewingVehicleBooking(null)}
        />
      )}

      {cancellingBooking && (
        <ConfirmModal
          title="Annuler cette réservation ?"
          description={`La réservation de ${cancellingBooking.client?.name || 'ce client'} sera marquée comme annulée.`}
          confirmLabel="Annuler la réservation"
          onConfirm={handleConfirmCancelBooking}
          onCancel={() => setCancellingBooking(null)}
        />
      )}

      {cancellingVehicleBooking && (
        <ConfirmModal
          title="Annuler cette réservation ?"
          description={`La location du véhicule sera marquée comme annulée.`}
          confirmLabel="Annuler la réservation"
          onConfirm={handleConfirmCancelVehicleBooking}
          onCancel={() => setCancellingVehicleBooking(null)}
        />
      )}
    </div>
  );
}

export default BookingsTab;
