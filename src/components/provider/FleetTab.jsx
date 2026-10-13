import { useCallback, useEffect, useState } from 'react';
import {
  getListingVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  createVehicleBooking,
} from '../../services/vehicleService';
import { getMySubscription } from '../../services/subscriptionService';
import { cheapestPlanAbove } from '../../utils/planFeatures';
import PlanLockedNotice from './PlanLockedNotice';
import VehicleFormModal from './VehicleFormModal';
import VehicleBookingModal from './VehicleBookingModal';
import VehicleDecorationsModal from './VehicleDecorationsModal';
import VehicleOptionsModal from './VehicleOptionsModal';
import VehicleReservationsModal from './VehicleReservationsModal';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCar,
  IconUsers,
  IconSparkles,
  IconDoorOpen,
  IconGauge,
  IconFlower,
  IconSuitcase,
  IconCalendar,
  IconTag,
} from '../icons';
import { hasPositivePrice } from '../../utils/rentalPricing';

const TYPE_LABELS = { voiture: 'Voiture', bus: 'Bus', minibus: 'Minibus' };
const TRANSMISSION_LABELS = { manuelle: 'Boîte manuelle', automatique: 'Boîte automatique' };

// Limite selon le plan souscrit (Parametres admin > Plans & Tarifs) - null
// cote API = illimite. Infinity par defaut le temps du chargement pour ne pas
// bloquer a tort le bouton "Ajouter un vehicule".
const UNLIMITED_LIMITS = { label: '', maxVehicles: Infinity };

function FleetTab({ listingId }) {
  const [vehicles, setVehicles] = useState([]);
  const [limits, setLimits] = useState(UNLIMITED_LIMITS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [decorationsVehicle, setDecorationsVehicle] = useState(null);
  const [optionsVehicle, setOptionsVehicle] = useState(null);
  const [reservationsVehicle, setReservationsVehicle] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListingVehicles(listingId);
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la flotte.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchVehicles();
    getMySubscription()
      .then((subscription) => {
        const planLimits = subscription.plans[subscription.effectivePlan];
        setLimits({
          label: planLimits.label,
          maxVehicles: planLimits.maxVehicles === null ? Infinity : planLimits.maxVehicles,
          requiredPlan: cheapestPlanAbove(subscription.plans, 'maxVehicles', 0),
        });
      })
      .catch(() => {});
  }, [fetchVehicles]);

  const maxVehicles = limits.maxVehicles;
  const limitReached = vehicles.length >= maxVehicles;

  const handleAdd = async (payload) => {
    await addVehicle(listingId, payload);
    setShowForm(false);
    await fetchVehicles();
  };

  const handleUpdate = async (payload) => {
    await updateVehicle(editingVehicle.id, payload);
    setEditingVehicle(null);
    await fetchVehicles();
  };

  const handleDelete = async (vehicle) => {
    try {
      await deleteVehicle(vehicle.id);
      await fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de retirer ce véhicule.');
    }
  };

  const handleBooking = async (payload) => {
    await createVehicleBooking(bookingVehicle.id, payload);
    setBookingVehicle(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Ma flotte</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={limitReached}
          title={
            limitReached
              ? `Limite de ${maxVehicles} véhicule(s) atteinte pour le plan ${limits.label}.`
              : undefined
          }
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPlus className="h-4 w-4" />
          Ajouter un véhicule
        </button>
      </div>

      {maxVehicles === 0 ? (
        <div className="mt-4">
          <PlanLockedNotice
            feature="Gestion de flotte"
            currentPlan={limits.label}
            requiredPlan={limits.requiredPlan}
          />
        </div>
      ) : limits.label && (
        <p className="mt-2 text-xs text-gray-500">
          Plan {limits.label} : {vehicles.length} / {Number.isFinite(maxVehicles) ? maxVehicles : 'illimité'}{' '}
          véhicule(s) utilisé(s).
        </p>
      )}
      {limitReached && maxVehicles !== 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Limite de {maxVehicles} véhicule(s) atteinte pour le plan {limits.label}. Passez à un plan
          supérieur pour en ajouter davantage.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Enregistrement d'un accord conclu en direct, aucun paiement traité par la plateforme — les
        montants sont déclaratifs.
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : vehicles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <IconCar className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Aucun véhicule dans votre flotte pour le moment.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              {vehicle.imageUrl ? (
                <img loading="lazy" decoding="async" src={vehicle.imageUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-gray-50 text-gray-300">
                  <IconCar className="h-10 w-10" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.brand}</h3>
                    {vehicle.model && <p className="text-sm text-gray-600">Modèle {vehicle.model}</p>}
                    <p className="text-xs text-gray-500">{TYPE_LABELS[vehicle.type]}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {hasPositivePrice(vehicle.pricePerDay) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {vehicle.pricePerDay} DT/j
                      </span>
                    )}
                    {hasPositivePrice(vehicle.pricePerHour) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {vehicle.pricePerHour} DT/h
                      </span>
                    )}
                    {!hasPositivePrice(vehicle.pricePerDay) && !hasPositivePrice(vehicle.pricePerHour) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Sur devis
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-start gap-2 text-xs">
                  {vehicle.seats && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      <IconUsers className="h-3.5 w-3.5" />
                      {vehicle.seats} places
                    </span>
                  )}
                  {vehicle.doors && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      <IconDoorOpen className="h-3.5 w-3.5" />
                      {vehicle.doors} portes
                    </span>
                  )}
                  {vehicle.luggage != null && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      <IconSuitcase className="h-3.5 w-3.5" />
                      {vehicle.luggage} valises
                    </span>
                  )}
                  {vehicle.transmission && (
                    <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      <IconGauge className="h-3.5 w-3.5" />
                      {TRANSMISSION_LABELS[vehicle.transmission]}
                    </span>
                  )}
                  {vehicle.airConditioned && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      <IconSparkles className="h-3.5 w-3.5" />
                      Climatisé
                    </span>
                  )}
                  {vehicle.withDriver && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">Avec chauffeur</span>
                  )}
                  {vehicle.hasDecoration && (
                    <span className="flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-pink-700">
                      <IconFlower className="h-3.5 w-3.5" />
                      {vehicle.decorations?.length
                        ? `${vehicle.decorations.length} modèle${vehicle.decorations.length > 1 ? 's' : ''} décoration`
                        : 'Décoration'}
                    </span>
                  )}
                  {vehicle.options?.length > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      <IconTag className="h-3.5 w-3.5" />
                      {vehicle.options.length} option{vehicle.options.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {vehicle.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-gray-500">{vehicle.description}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-3">
                  {vehicle.hasDecoration && (
                    <button
                      type="button"
                      onClick={() => setDecorationsVehicle(vehicle)}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      <IconFlower className="h-3.5 w-3.5" />
                      Gérer les modèles de décoration
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOptionsVehicle(vehicle)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    <IconTag className="h-3.5 w-3.5" />
                    Gérer les options supplémentaires
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBookingVehicle(vehicle)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                    >
                      Enregistrer une location
                    </button>
                    <button
                      type="button"
                      onClick={() => setReservationsVehicle(vehicle)}
                      title="Voir les réservations et la disponibilité"
                      aria-label="Voir les réservations"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                    >
                      <IconCalendar className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingVehicle(vehicle)}
                      title="Modifier"
                      aria-label="Modifier"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(vehicle)}
                      title="Retirer de la flotte"
                      aria-label="Retirer de la flotte"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <VehicleFormModal onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {editingVehicle && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onSave={handleUpdate}
          onCancel={() => setEditingVehicle(null)}
        />
      )}

      {bookingVehicle && (
        <VehicleBookingModal
          vehicle={bookingVehicle}
          onSave={handleBooking}
          onCancel={() => setBookingVehicle(null)}
        />
      )}

      {decorationsVehicle && (
        <VehicleDecorationsModal
          vehicle={decorationsVehicle}
          onClose={() => setDecorationsVehicle(null)}
          onChanged={fetchVehicles}
        />
      )}

      {optionsVehicle && (
        <VehicleOptionsModal
          vehicle={optionsVehicle}
          onClose={() => setOptionsVehicle(null)}
          onChanged={fetchVehicles}
        />
      )}

      {reservationsVehicle && (
        <VehicleReservationsModal
          vehicle={reservationsVehicle}
          onClose={() => setReservationsVehicle(null)}
        />
      )}
    </div>
  );
}

export default FleetTab;
