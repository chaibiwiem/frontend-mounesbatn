import { useEffect, useState } from 'react';
import { getMyListing } from '../../services/listingService';
import { createPackage, updatePackage, deletePackage } from '../../services/packageService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

const PRICE_TYPE_LABELS = {
  fixed: 'Prix fixe',
  from: 'À partir de',
  per_hour: 'Par heure',
  on_quote: 'Sur devis',
};

const initialForm = { name: '', description: '', price: '', priceType: 'from', duration: '' };

function PackagesTab() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const listing = await getMyListing();
      setPackages(listing.packages);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les packs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom du pack est requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createPackage(form);
      setForm(initialForm);
      await fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer ce pack.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePackage(id);
      await fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer ce pack.');
    }
  };

  const handlePriceTypeChange = async (id, priceType) => {
    try {
      await updatePackage(id, { priceType });
      await fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour ce pack.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Mes packs</h2>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : (
        <div className="mt-4 space-y-3">
          {packages.length === 0 && (
            <p className="text-sm text-gray-500">Aucun pack pour le moment.</p>
          )}
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                <button
                  type="button"
                  onClick={() => handleDelete(pkg.id)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
              {pkg.description && <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-rose-600">
                  {pkg.price ? `${pkg.price} DT` : 'Sur devis'}
                </span>
                <select
                  value={pkg.priceType}
                  onChange={(e) => handlePriceTypeChange(pkg.id, e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                >
                  {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">Ajouter un pack</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom *</label>
          <input required name="name" value={form.name} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix (DT)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de prix</label>
            <select name="priceType" value={form.priceType} onChange={handleChange} className={inputClass}>
              {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Durée (optionnel)</label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="ex: 4 heures"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {saving ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
}

export default PackagesTab;
