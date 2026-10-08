import { useEffect, useMemo, useState } from 'react';
import { getMyListing, getCategories, updateMyCategories } from '../../services/listingService';
import { getMySubscription } from '../../services/subscriptionService';
import { cheapestPlanAbove } from '../../utils/planFeatures';
import PlanLockedNotice from './PlanLockedNotice';

// Sous-categories ou la fiche apparait en recherche : celle d'inscription
// (fixe, comptee comme la 1re) + des supplementaires choisies ici, dans la
// limite du plan (Plan.maxCategories - null cote API = illimite). Le backend
// (listingController.updateMyCategories) reste l'autorite finale.
function CategoriesSection() {
  const [listing, setListing] = useState(null);
  const [tree, setTree] = useState([]);
  const [limits, setLimits] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMyListing(), getCategories(), getMySubscription()])
      .then(([listingData, categories, subscription]) => {
        setListing(listingData);
        setTree(categories);
        setSelectedIds((listingData.extraCategories || []).map((c) => c.id));
        const planLimits = subscription.plans[subscription.effectivePlan];
        setLimits({
          label: planLimits.label,
          maxCategories: planLimits.maxCategories === null ? Infinity : planLimits.maxCategories,
          requiredPlan: cheapestPlanAbove(subscription.plans, 'maxCategories', 1),
        });
      })
      .catch(() => setError('Impossible de charger vos catégories.'));
  }, []);

  const maxExtras = limits ? Math.max(0, limits.maxCategories - 1) : 0;
  const usedTotal = 1 + selectedIds.length;
  const limitReached = selectedIds.length >= maxExtras;

  // Uniquement les familles ayant des sous-categories (un prestataire est
  // toujours rattache a une sous-categorie precise, jamais a une famille).
  const groups = useMemo(() => tree.filter((c) => c.children?.length > 0), [tree]);

  const toggle = (categoryId) => {
    setMessage('');
    setError('');
    setSelectedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : prev.length >= maxExtras
          ? prev
          : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await updateMyCategories(selectedIds);
      setSelectedIds(data.extraCategories.map((c) => c.id));
      setMessage('Catégories mises à jour.');
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!listing || !limits) {
    return error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null;
  }

  const maxLabel = Number.isFinite(limits.maxCategories) ? limits.maxCategories : 'illimité';

  return (
    <div className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-xl font-bold text-gray-900">Mes catégories</h2>
      <p className="mt-1 text-sm text-gray-500">
        Apparaissez dans plusieurs sous-catégories de recherche. Votre catégorie d&apos;inscription
        compte comme la première.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Plan {limits.label} : {usedTotal} / {maxLabel} catégorie(s) utilisée(s).
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
          {listing.category?.name} · inscription
        </span>
      </div>

      {maxExtras === 0 ? (
        <div className="mt-4">
          <PlanLockedNotice
            feature="Catégories supplémentaires"
            currentPlan={limits.label}
            requiredPlan={limits.requiredPlan}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{group.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.children
                    .filter((child) => child.id !== listing.categoryId)
                    .map((child) => {
                      const checked = selectedIds.includes(child.id);
                      const disabled = !checked && limitReached;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => toggle(child.id)}
                          disabled={disabled}
                          aria-pressed={checked}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            checked
                              ? 'border-rose-600 bg-rose-50 text-rose-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-rose-400'
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          {checked ? '✓ ' : ''}
                          {child.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {limitReached && Number.isFinite(limits.maxCategories) && (
            <p className="mt-3 text-xs text-gray-500">
              Limite de {limits.maxCategories} catégorie(s) atteinte pour le plan {limits.label}.
              Passez à un plan supérieur pour en ajouter davantage.
            </p>
          )}

          {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer mes catégories'}
          </button>
        </>
      )}
    </div>
  );
}

export default CategoriesSection;
