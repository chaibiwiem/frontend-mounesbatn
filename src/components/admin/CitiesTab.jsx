import { useEffect, useState } from 'react';
import { getCitiesAdmin, createCity, updateCity, deleteCity } from '../../services/adminService';
import { IconEdit, IconTrash, IconPlus } from '../icons';

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function CityRow({ city, onSave, onToggle, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(city.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(city.id, { name: name.trim() });
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={`${inputClass} w-full`}
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => {
              setName(city.name);
              setEditing(false);
            }}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${city.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
        <p className="text-sm font-medium text-gray-900">{city.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <ToggleSwitch checked={city.isActive} onChange={() => onToggle(city)} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Modifier"
          aria-label="Modifier"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <IconEdit className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(city)}
          title="Supprimer"
          aria-label="Supprimer"
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Gestion des villes/regions (M10) : liste plate geree par l'admin, utilisee
// partout ou une ville est selectionnee (filtres de recherche, inscription
// prestataire...) a la place de l'ancien tableau statique TUNISIAN_CITIES.
// `listings.city` reste une simple chaine : supprimer une ville ici n'affecte
// jamais les fiches existantes.
function CitiesTab() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState('');

  const fetchCities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCitiesAdmin();
      setCities(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les villes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleSave = async (id, payload) => {
    await updateCity(id, payload);
    await fetchCities();
  };

  const handleToggle = async (city) => {
    try {
      await updateCity(city.id, { isActive: !city.isActive });
      await fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cette ville.');
    }
  };

  const handleDelete = async (city) => {
    try {
      await deleteCity(city.id);
      await fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cette ville.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingNew(true);
    setNewError('');
    try {
      await createCity({ name: newName.trim() });
      setNewName('');
      setAdding(false);
      await fetchCities();
    } catch (err) {
      setNewError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Impossible d'ajouter cette ville."
      );
    } finally {
      setSavingNew(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Villes / Régions</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <IconPlus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Liste utilisée dans les filtres de recherche et le formulaire d'inscription prestataire.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {adding && (
        <form
          onSubmit={handleCreate}
          className="mt-4 rounded-xl border border-dashed border-rose-200 p-3"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de la ville / région"
            autoFocus
            className={`${inputClass} w-full max-w-sm`}
          />
          {newError && <p className="mt-1.5 text-xs text-red-600">{newError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={savingNew}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {savingNew ? 'Ajout...' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewError('');
                setNewName('');
              }}
              disabled={savingNew}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cities.length === 0 && !adding && (
          <p className="text-sm text-gray-400">Aucune ville pour le moment.</p>
        )}
        {cities.map((city) => (
          <CityRow key={city.id} city={city} onSave={handleSave} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

export default CitiesTab;
