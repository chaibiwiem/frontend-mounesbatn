import { useEffect, useState } from 'react';
import { getMyListing, updateMyListing } from '../../services/listingService';
import { AMENITY_ICON_OPTIONS, AMENITY_ICON_MAP, DEFAULT_AMENITY_ICON } from '../../utils/amenities';
import { IconX } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function EquipmentsTab() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newIcon, setNewIcon] = useState(AMENITY_ICON_OPTIONS[0].key);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    getMyListing()
      .then((listing) => setAmenities(listing.amenities || []))
      .catch(() => setError('Impossible de charger vos équipements.'))
      .finally(() => setLoading(false));
  }, []);

  const addAmenity = () => {
    if (!newName.trim()) return;
    setAmenities((prev) => [...prev, { icon: newIcon, name: newName.trim() }]);
    setNewName('');
  };

  const removeAmenity = (index) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateMyListing({ amenities });
      setMessage('Équipements mis à jour avec succès.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de sauvegarder les équipements.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Équipements</h2>
      <p className="mt-1 text-sm text-gray-500">
        Ajoutez les équipements de votre choix (icône + nom) — affichés sur votre fiche publique.
      </p>

      {amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.map((item, index) => {
            const Icon = AMENITY_ICON_MAP[item.icon] || DEFAULT_AMENITY_ICON;
            return (
              <span
                key={index}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pl-3 pr-2 text-sm text-gray-700"
              >
                <Icon className="h-4 w-4 text-gray-500" />
                {item.name}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label={`Retirer ${item.name}`}
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4">
        <p className="text-xs font-medium text-gray-500">Icône</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {AMENITY_ICON_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const selected = newIcon === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setNewIcon(opt.key)}
                title={opt.label}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                  selected
                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1" style={{ minWidth: '200px' }}>
            <label className="block text-xs font-medium text-gray-500">Nom</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`ex: ${AMENITY_ICON_OPTIONS.find((opt) => opt.key === newIcon)?.label || 'Piscine'}`}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={addAmenity}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Ajouter
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
}

export default EquipmentsTab;
