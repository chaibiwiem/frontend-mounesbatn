import { useState } from 'react';
import { IconFlower } from './icons';
import { hasPositivePrice } from '../utils/rentalPricing';

// Popup de choix du modele de decoration (mariage/fiancailles) parmi ceux
// proposes par le vehicule - un seul modele applicable a la fois, style
// carte + case a cocher (repris de la maquette "Obtenez le meilleur devis").
function DecorationPickerModal({ decorations, selectedId, vehicleLabel, onConfirm, onClose }) {
  const [localSelectedId, setLocalSelectedId] = useState(selectedId ?? null);

  const toggle = (id) => {
    setLocalSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Choisissez un modèle de décoration</h2>
          {vehicleLabel && <p className="text-sm text-gray-500">{vehicleLabel}</p>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {decorations.map((decoration) => {
              const isSelected = localSelectedId === decoration.id;
              return (
                <button
                  key={decoration.id}
                  type="button"
                  onClick={() => toggle(decoration.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    isSelected ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                        <path
                          d="M3 8.5l3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

                  {decoration.imageUrl ? (
                    <img src={decoration.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
                      <IconFlower className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{decoration.name}</h3>
                    {decoration.description && (
                      <p className="line-clamp-1 text-xs text-gray-500">{decoration.description}</p>
                    )}
                    {hasPositivePrice(decoration.price) && (
                      <p className="mt-0.5 text-sm font-semibold text-green-600">{decoration.price} DT</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(localSelectedId)}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default DecorationPickerModal;
