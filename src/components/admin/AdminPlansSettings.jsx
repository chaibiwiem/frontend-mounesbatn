import { useEffect, useState } from 'react';
import { getPlans, updatePlan } from '../../services/adminService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

// Formulaire d'un plan : champs max* vides/decoches = illimite (NULL cote
// base, voir Plan.js) - pertinent pour Premium/Elite en pratique, mais laisse
// disponible pour tout plan.
function PlanCard({ plan, onSave }) {
  const [form, setForm] = useState({
    description: plan.description || '',
    price: plan.price,
    priceYearly: plan.priceYearly,
    unlimitedPhotos: plan.maxPhotos === null,
    maxPhotos: plan.maxPhotos === null ? '' : plan.maxPhotos,
    unlimitedVideos: plan.maxVideos === null,
    maxVideos: plan.maxVideos === null ? '' : plan.maxVideos,
    unlimitedPromotions: plan.maxPromotions === null,
    maxPromotions: plan.maxPromotions === null ? '' : plan.maxPromotions,
    featured: plan.featured,
    eventsEnabled: plan.eventsEnabled,
    calendarEnabled: plan.calendarEnabled,
    unlimitedVehicles: plan.maxVehicles === null,
    maxVehicles: plan.maxVehicles === null ? '' : plan.maxVehicles,
    unlimitedCategories: plan.maxCategories === null,
    maxCategories: plan.maxCategories === null ? '' : plan.maxCategories,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await onSave(plan.key, {
        description: form.description,
        price: form.price,
        priceYearly: form.priceYearly,
        maxPhotos: form.unlimitedPhotos ? null : form.maxPhotos,
        maxVideos: form.unlimitedVideos ? null : form.maxVideos,
        maxPromotions: form.unlimitedPromotions ? null : form.maxPromotions,
        featured: form.featured,
        eventsEnabled: form.eventsEnabled,
        calendarEnabled: form.calendarEnabled,
        maxVehicles: form.unlimitedVehicles ? null : form.maxVehicles,
        maxCategories: form.unlimitedCategories ? null : form.maxCategories,
      });
      setForm((prev) => ({
        ...prev,
        unlimitedPhotos: updated.maxPhotos === null,
        maxPhotos: updated.maxPhotos === null ? '' : updated.maxPhotos,
        unlimitedVideos: updated.maxVideos === null,
        maxVideos: updated.maxVideos === null ? '' : updated.maxVideos,
        unlimitedPromotions: updated.maxPromotions === null,
        maxPromotions: updated.maxPromotions === null ? '' : updated.maxPromotions,
        unlimitedVehicles: updated.maxVehicles === null,
        maxVehicles: updated.maxVehicles === null ? '' : updated.maxVehicles,
        unlimitedCategories: updated.maxCategories === null,
        maxCategories: updated.maxCategories === null ? '' : updated.maxCategories,
      }));
      setMessage('Plan mis à jour.');
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder ce plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
        {form.featured && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
            Mis en avant
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className={labelClass}>Description</label>
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
            <label className={labelClass}>Prix mensuel (DT)</label>
            <input
              type="number"
              name="price"
              min="0"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Prix annuel (DT)</label>
            <input
              type="number"
              name="priceYearly"
              min="0"
              value={form.priceYearly}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {(() => {
          // Economie annuelle calculee automatiquement : 12 x prix mensuel -
          // prix annuel (ex. 29 x 12 - 290 = 58 DT).
          const monthly = Number(form.price) || 0;
          const yearly = Number(form.priceYearly) || 0;
          if (monthly <= 0 || yearly <= 0) return null;
          const savings = Math.round((monthly * 12 - yearly) * 100) / 100;
          if (savings <= 0) {
            return (
              <p className="text-xs text-amber-600">
                Aucune économie : le prix annuel est supérieur ou égal à 12 × le prix mensuel ({monthly * 12} DT).
              </p>
            );
          }
          const percent = Math.round((savings / (monthly * 12)) * 100);
          return (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Économie annuelle : <strong>{savings} DT</strong> ({percent} %)
            </p>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Photos max</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                name="maxPhotos"
                min="0"
                disabled={form.unlimitedPhotos}
                value={form.maxPhotos}
                onChange={handleChange}
                className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  name="unlimitedPhotos"
                  checked={form.unlimitedPhotos}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                />
                Illimité
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass}>Vidéos max</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                name="maxVideos"
                min="0"
                disabled={form.unlimitedVideos}
                value={form.maxVideos}
                onChange={handleChange}
                className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  name="unlimitedVideos"
                  checked={form.unlimitedVideos}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                />
                Illimité
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Promotions max</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              name="maxPromotions"
              min="0"
              disabled={form.unlimitedPromotions}
              value={form.maxPromotions}
              onChange={handleChange}
              className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                name="unlimitedPromotions"
                checked={form.unlimitedPromotions}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              Illimité
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Véhicules max (flotte Transport)</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              name="maxVehicles"
              min="0"
              disabled={form.unlimitedVehicles}
              value={form.maxVehicles}
              onChange={handleChange}
              className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                name="unlimitedVehicles"
                checked={form.unlimitedVehicles}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              Illimité
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Catégories max (catégorie d&apos;inscription comprise)</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              name="maxCategories"
              min="1"
              disabled={form.unlimitedCategories}
              value={form.maxCategories}
              onChange={handleChange}
              className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                name="unlimitedCategories"
                checked={form.unlimitedCategories}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              Illimité
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          Mettre ce plan en avant (badge sur les fiches)
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="eventsEnabled"
            checked={form.eventsEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          Autoriser "Mes événements" (espace prestataire)
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="calendarEnabled"
            checked={form.calendarEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          Autoriser le "Calendrier" des disponibilités (espace prestataire)
        </label>
      </div>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

// Tarification des plans Starter/Pro/Premium/Elite (CLAUDE.md/MODULES.md M9) :
// aucun paiement en ligne, ces valeurs servent uniquement de reference pour
// la facturation manuelle (hors plateforme) et l'affichage aux prestataires.
function AdminPlansSettings() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError('Impossible de charger les plans.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, payload) => {
    const updated = await updatePlan(key, payload);
    setPlans((prev) => prev.map((p) => (p.key === key ? updated : p)));
    return updated;
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900">Plans & Tarifs</h3>
      <p className="mt-1 text-sm text-gray-500">
        Ces montants sont déclaratifs — aucun paiement en ligne n'est traité par la plateforme, la
        facturation des prestataires reste manuelle.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}

export default AdminPlansSettings;
