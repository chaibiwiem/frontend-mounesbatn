import { useState } from 'react';
import { IconCar, IconUsers, IconSparkles, IconDoorOpen, IconGauge, IconFlower, IconSuitcase } from './icons';
import DecorationPickerModal from './DecorationPickerModal';
import { hasPositivePrice } from '../utils/rentalPricing';

const TRANSMISSION_LABELS = { manuelle: 'Boîte manuelle', automatique: 'Boîte automatique' };

// Uniquement rendue si des vehicules existent (categorie Transport) - voir
// ListingDetail.jsx, qui recupere la flotte via GET /listings/:id/vehicles.
// Choisir un vehicule (voiture ou bus) ouvre directement le formulaire de
// demande de location pre-rempli avec ce vehicule - pas besoin de le
// selectionner puis d'aller chercher le bouton "Nous contacter" separement.
// Si le vehicule propose des modeles de decoration, le client en choisit un
// via un popup dedie (DecorationPickerModal) avant de faire sa demande : le
// choix est transmis via onChooseVehicle(vehicleId, decorationId) et
// pre-rempli dans le formulaire (cf. ContactForm.initialDecorationId).
function VehicleFleetSection({ vehicles, selectedVehicleId, onChooseVehicle }) {
  const [decorationChoices, setDecorationChoices] = useState({});
  const [pickerVehicle, setPickerVehicle] = useState(null);

  if (!vehicles || vehicles.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-gray-900">Notre flotte</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          const selectedDecorationId = decorationChoices[vehicle.id] ?? null;
          const selectedDecoration = vehicle.decorations?.find((d) => d.id === selectedDecorationId);
          return (
            <div
              key={vehicle.id}
              className={`overflow-hidden rounded-xl border transition ${
                isSelected ? 'border-rose-300 bg-rose-50' : 'border-gray-100'
              }`}
            >
              {vehicle.imageUrl ? (
                <img src={vehicle.imageUrl} alt="" className="h-40 w-full object-cover" />
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
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {hasPositivePrice(vehicle.pricePerDay) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {vehicle.pricePerDay} DT/j
                      </span>
                    )}
                    {hasPositivePrice(vehicle.pricePerHour) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {vehicle.pricePerHour} DT/h
                      </span>
                    )}
                    {!hasPositivePrice(vehicle.pricePerDay) && !hasPositivePrice(vehicle.pricePerHour) && (
                      <span className="whitespace-nowrap rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
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
                </div>

                {vehicle.description && (
                  <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                    <p className="text-sm font-bold text-rose-700">
                      {vehicle.perksTitle || 'Nous vous offrons GRATUITEMENT en plus'}
                    </p>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {vehicle.description
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, index) => (
                          <li key={index} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="mt-0.5 font-bold text-rose-600">✓</span>
                            <span>{line}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {vehicle.hasDecoration && vehicle.decorations?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPickerVehicle(vehicle)}
                    className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-pink-100 bg-pink-50/50 p-2.5 text-left"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-pink-700">
                      <IconFlower className="h-3.5 w-3.5" />
                      {selectedDecoration ? selectedDecoration.name : 'Choisir un modèle de décoration'}
                      {selectedDecoration && hasPositivePrice(selectedDecoration.price)
                        ? ` (${selectedDecoration.price} DT)`
                        : ''}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-rose-600">
                      {selectedDecoration ? 'Modifier' : 'Voir les modèles'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onChooseVehicle(vehicle.id, selectedDecorationId)}
                  className="mt-3 w-full rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                >
                  {isSelected ? 'Véhicule sélectionné ✓' : 'Réserver'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pickerVehicle && (
        <DecorationPickerModal
          decorations={pickerVehicle.decorations}
          selectedId={decorationChoices[pickerVehicle.id] ?? null}
          vehicleLabel={`${pickerVehicle.brand || ''} ${pickerVehicle.model || ''}`.trim()}
          onClose={() => setPickerVehicle(null)}
          onConfirm={(decorationId) => {
            setDecorationChoices((prev) => ({ ...prev, [pickerVehicle.id]: decorationId }));
            setPickerVehicle(null);
          }}
        />
      )}
    </div>
  );
}

export default VehicleFleetSection;
