import { useEffect, useState } from 'react';
import { getMyListing } from '../../services/listingService';
import { getMySubscription } from '../../services/subscriptionService';
import { createPromotion, updatePromotion, deletePromotion } from '../../services/promotionService';
import { cheapestPlanAbove } from '../../utils/planFeatures';
import PlanLockedNotice from './PlanLockedNotice';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

const initialForm = { type: 'percent', value: '', label: '', startDate: '', endDate: '' };

// Limite indicative cote client (comptage simple des promotions actives) - le
// backend (promotionController.createPromotion) reste l'autorite finale, avec
// une fenetre de dates en plus, voir CLAUDE.md/MODULES.md M9.
const UNLIMITED_LIMITS = { label: '', maxPromotions: Infinity };

function PromotionsTab() {
  const [promotions, setPromotions] = useState([]);
  const [limits, setLimits] = useState(UNLIMITED_LIMITS);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const listing = await getMyListing();
      setPromotions(listing.promotions);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les promotions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const subscription = await getMySubscription();
      const planLimits = subscription.plans[subscription.effectivePlan];
      setLimits({
        label: planLimits.label,
        maxPromotions: planLimits.maxPromotions === null ? Infinity : planLimits.maxPromotions,
        requiredPlan: cheapestPlanAbove(subscription.plans, 'maxPromotions', 0),
      });
    } catch {
      // Abonnement illisible : aucune limite affichee/appliquee cote client.
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchLimits();
  }, []);

  const activeCount = promotions.filter((p) => p.isActive).length;
  const limitReached = activeCount >= limits.maxPromotions;
  const maxPromotionsLabel = Number.isFinite(limits.maxPromotions) ? limits.maxPromotions : 'illimité';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.value) {
      setError('Le libellé et la valeur sont requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createPromotion(form);
      setForm(initialForm);
      await fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer cette promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updatePromotion(promo.id, { isActive: !promo.isActive });
      await fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cette promotion.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id);
      await fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cette promotion.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Mes promotions</h2>
      {limits.maxPromotions === 0 ? (
        <div className="mt-4">
          <PlanLockedNotice
            feature="Promotions"
            currentPlan={limits.label}
            requiredPlan={limits.requiredPlan}
          />
        </div>
      ) : limits.label && (
        <p className="mt-1 text-sm text-gray-500">
          Plan {limits.label} : {activeCount} / {maxPromotionsLabel} promotion(s) active(s).
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : (
        <div className="mt-4 space-y-3">
          {promotions.length === 0 && (
            <p className="text-sm text-gray-500">Aucune promotion pour le moment.</p>
          )}
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{promo.label}</p>
                <p className="text-sm text-gray-500">
                  {promo.type === 'percent' ? `${promo.value}%` : `${promo.value} DT`}
                  {promo.startDate && ` · du ${promo.startDate}`}
                  {promo.endDate && ` au ${promo.endDate}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(promo)}
                  disabled={!promo.isActive && limitReached}
                  title={!promo.isActive && limitReached ? `Limite de ${maxPromotionsLabel} promotion(s) active(s) atteinte pour le plan ${limits.label}.` : undefined}
                  className={`rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                    promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {promo.isActive ? 'Active' : 'Désactivée'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(promo.id)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {limits.maxPromotions !== 0 && (
      <form
        onSubmit={handleCreate}
        className="mt-6 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
      >
        <h3 className="font-semibold text-gray-900">Créer une promotion</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Libellé *</label>
          <input required
            name="label"
            value={form.label}
            onChange={handleChange}
            placeholder="ex: -10% nouveaux clients"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (DT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valeur *</label>
            <input required
              type="number"
              name="value"
              value={form.value}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de début</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de fin</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {limitReached && (
          <p className="text-xs text-gray-500">
            Limite de {maxPromotionsLabel} promotion(s) active(s) atteinte pour le plan {limits.label}.
            Passez à un plan supérieur pour en créer davantage.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || limitReached}
          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {saving ? 'Création...' : 'Créer la promotion'}
        </button>
      </form>
      )}
    </div>
  );
}

export default PromotionsTab;
