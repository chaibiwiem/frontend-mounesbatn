import { useEffect, useState } from 'react';
import { getPlans } from '../../services/adminService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

function PlanModal({ listing, subscription, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    plan: subscription?.plan || 'starter',
    billingCycle: subscription?.billingCycle || 'monthly',
    status: subscription?.status || 'active',
    startDate: subscription?.startDate || '',
    endDate: subscription?.endDate || '',
    price: subscription?.price ?? '',
    paymentReference: subscription?.paymentReference || '',
    notes: subscription?.notes || '',
  });
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);

  // Retard de paiement : l'abonnement TEL QU'IL ETAIT avant cette edition
  // (endDate/status d'origine, jamais les valeurs en cours de saisie dans le
  // formulaire) etait deja expire - meme regle que
  // planService.isSubscriptionExpired. Le nombre de jours de retard (depuis
  // la date d'expiration jusqu'a aujourd'hui) est ajoute a la nouvelle
  // periode facturee ci-dessous, pour que le renouvellement couvre aussi la
  // periode impayee et pas seulement la nouvelle echeance choisie.
  const today = new Date().toISOString().slice(0, 10);
  const wasExpired = Boolean(
    subscription && (subscription.status !== 'active' || (subscription.endDate && subscription.endDate < today))
  );
  const lateDays =
    wasExpired && subscription?.endDate && subscription.endDate < today
      ? Math.round((new Date(today) - new Date(subscription.endDate)) / 86400000)
      : 0;

  // Periode automatique : Expiration = Debut + 1 mois/an selon la
  // Facturation choisie (meme regle que planService.addInterval cote
  // backend). L'admin garde la main pour saisir une Expiration personnalisee
  // ensuite - seuls les changements de Debut/Facturation la recalculent.
  function addInterval(startDate, billingCycle) {
    if (!startDate) return '';
    const next = new Date(startDate);
    if (billingCycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString().slice(0, 10);
  }

  // Prorata du tarif du catalogue sur le nombre de jours reel entre debut et
  // expiration, plus le retard de paiement eventuel (lateDays) - couvre toute
  // duree personnalisee, pas seulement un mois/an plein. Le tarif JOURNALIER
  // depend du cycle choisi (mensuel: prix/30, annuel: prixAnnuel/365) - le
  // prix annuel etant generalement degressif par rapport a 12x le mensuel,
  // utiliser le tarif mensuel pour une duree annuelle aurait surestime le
  // montant (ex. Premium 49 DT/mois x 365/30 = 596 DT au lieu des 490 DT/an
  // catalogue). Retourne null si les deux dates ne sont pas renseignees ou
  // incoherentes (fallback sur le tarif mensuel/annuel fixe ci-dessous).
  function computePriceFromDates(planData, startDate, endDate, billingCycle) {
    if (!startDate || !endDate) return null;
    const days = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
    if (!Number.isFinite(days) || days <= 0) return null;
    const dailyRate = billingCycle === 'yearly' ? planData.priceYearly / 365 : planData.price / 30;
    return Math.round((dailyRate * (days + lateDays) + Number.EPSILON) * 1000) / 1000;
  }

  // Prix (Parametres admin > Plans & Tarifs) recopie automatiquement des qu'on
  // change de plan, de cycle de facturation ou des dates debut/expiration -
  // au prorata des jours reels (+ retard de paiement) si les deux dates sont
  // renseignees, sinon le tarif mensuel/annuel fixe du catalogue. L'admin
  // garde la main pour corriger ensuite un montant reellement percu different
  // du calcul.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'startDate' || name === 'billingCycle') {
        next.endDate = addInterval(next.startDate, next.billingCycle);
      }
      if (['plan', 'billingCycle', 'startDate', 'endDate'].includes(name)) {
        const planData = plans.find((p) => p.key === next.plan);
        if (planData) {
          const proratedPrice = computePriceFromDates(planData, next.startDate, next.endDate, next.billingCycle);
          next.price =
            proratedPrice !== null
              ? proratedPrice
              : next.billingCycle === 'yearly'
                ? planData.priceYearly
                : planData.price;
        }
      }
      return next;
    });
  };

  const selectedPlanData = plans.find((p) => p.key === form.plan);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onConfirm({ ...form, endDate: form.endDate || null, price: form.price === '' ? undefined : form.price });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de mettre à jour cet abonnement.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier l&apos;abonnement</h3>
        <p className="mt-1 text-sm text-gray-500">{listing.title}</p>

        <form onSubmit={handleConfirm} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Plan</label>
              <select name="plan" value={form.plan} onChange={handleChange} className={inputClass}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="elite">Elite</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Facturation</label>
              <select
                name="billingCycle"
                value={form.billingCycle}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="monthly">
                  Mensuel{selectedPlanData ? ` — ${selectedPlanData.price} DT` : ''}
                </option>
                <option value="yearly">
                  Annuel{selectedPlanData ? ` — ${selectedPlanData.priceYearly} DT` : ''}
                </option>
              </select>
            </div>
          </div>

          {selectedPlanData && (
            <p className="-mt-2 text-xs text-gray-500">
              Tarif catalogue {selectedPlanData.label} :{' '}
              <strong className="text-gray-700">{selectedPlanData.price} DT / mois</strong> ·{' '}
              <strong className="text-gray-700">{selectedPlanData.priceYearly} DT / an</strong>
            </p>
          )}

          <div>
            <label className={labelClass}>Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="expired">Expirée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          {wasExpired && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Abonnement expiré{subscription?.endDate ? ` depuis le ${subscription.endDate}` : ''}
              {lateDays > 0 && ` (retard de ${lateDays} jour${lateDays > 1 ? 's' : ''})`} — le retard
              de paiement est automatiquement ajouté au montant calculé ci-dessous.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Début</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Expiration <span className="font-normal text-gray-400">(auto)</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Montant payé (DT)</label>
            <input
              type="number"
              step="0.001"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Calculé automatiquement au prorata entre Début et Expiration
              {lateDays > 0 ? `, + ${lateDays} jour${lateDays > 1 ? 's' : ''} de retard` : ''} (modifiable).
            </p>
          </div>

          <div>
            <label className={labelClass}>Référence paiement</label>
            <input
              name="paymentReference"
              value={form.paymentReference}
              onChange={handleChange}
              placeholder="ex: virement RIB, N° reçu..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes internes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
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

export default PlanModal;
