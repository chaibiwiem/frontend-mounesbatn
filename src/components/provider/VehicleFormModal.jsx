import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const TYPE_LABELS = { voiture: 'Voiture', bus: 'Bus', minibus: 'Minibus' };

function VehicleFormModal({ vehicle, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: vehicle?.type || 'voiture',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
    seats: vehicle?.seats || '',
    doors: vehicle?.doors || '',
    luggage: vehicle?.luggage || '',
    transmission: vehicle?.transmission || '',
    pricePerDay: vehicle?.pricePerDay || '',
    pricePerHour: vehicle?.pricePerHour || '',
    withDriver: vehicle?.withDriver || false,
    airConditioned: vehicle?.airConditioned || false,
    // Cochee par defaut pour un nouveau vehicule (voiture/minibus/bus, aucune
    // restriction de type) - le prestataire peut la decocher s'il ne propose
    // pas cette option pour ce vehicule precis. Valeur existante conservee
    // telle quelle en edition.
    hasDecoration: vehicle ? vehicle.hasDecoration : true,
    perksTitle: vehicle?.perksTitle || '',
    description: vehicle?.description || '',
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSave({ ...form, image });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer ce véhicule."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            {vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Type</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Places</label>
                <input
                  type="number"
                  name="seats"
                  min="1"
                  value={form.seats}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Portes</label>
                <input
                  type="number"
                  name="doors"
                  min="1"
                  max="10"
                  value={form.doors}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Valises</label>
                <input
                  type="number"
                  name="luggage"
                  min="0"
                  max="50"
                  value={form.luggage}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Boîte de vitesses</label>
                <select name="transmission" value={form.transmission} onChange={handleChange} className={inputClass}>
                  <option value="">Non précisé</option>
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Marque</label>
                <input name="brand" value={form.brand} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Modèle</label>
                <input name="model" value={form.model} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Année</label>
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tarif / jour (DT)</label>
                <input
                  type="number"
                  name="pricePerDay"
                  min="0"
                  value={form.pricePerDay}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tarif / heure (DT)</label>
                <input
                  type="number"
                  name="pricePerHour"
                  min="0"
                  value={form.pricePerHour}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Utilisé pour les locations de moins de 24h.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="withDriver"
                  checked={form.withDriver}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                Avec chauffeur
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="airConditioned"
                  checked={form.airConditioned}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                Climatisé
              </label>
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="hasDecoration"
                checked={form.hasDecoration}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              Option décoration disponible (mariage, fiançailles...)
              {vehicle && form.hasDecoration && (
                <span className="ml-auto text-xs font-normal text-gray-400">
                  Gérez les modèles depuis « Décorations » sur la fiche du véhicule.
                </span>
              )}
            </label>

            <div>
              <label className={labelClass}>Titre de la liste d&apos;avantages</label>
              <input
                name="perksTitle"
                value={form.perksTitle}
                onChange={handleChange}
                placeholder="Nous vous offrons GRATUITEMENT en plus"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Avantages offerts (un par ligne)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder={
                  'Un avantage par ligne, ex :\nPrise en charge à l\'aéroport\nConducteur supplémentaire\nKilométrage illimité'
                }
                className={inputClass}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
              <p className="mt-1 text-xs text-gray-400">
                Affiché sur la fiche publique sous forme de liste « Offert gratuitement ».
              </p>
            </div>

            <div>
              <label className={labelClass}>Photo {vehicle?.imageUrl ? '(remplacer)' : '(optionnel)'}</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="mt-1 text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-gray-100 px-6 py-4">
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

export default VehicleFormModal;
