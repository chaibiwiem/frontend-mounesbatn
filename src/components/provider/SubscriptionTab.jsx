import { useEffect, useState } from 'react';
import { getMySubscription } from '../../services/subscriptionService';
import { IconCheckCircle, IconDownload, IconFileText, IconLock } from '../icons';
import { isUnlimited, cheapestPlanAbove, cheapestPlanLabel } from '../../utils/planFeatures';
import { openDocument } from '../../services/documentService';

const PLAN_COLORS = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  elite: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS = { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' };
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
};

const BILLING_LABELS = { monthly: 'Mensuel', yearly: 'Annuel' };

const INVOICE_STATUS_LABELS = { unpaid: 'Non payée', paid: 'Payée', cancelled: 'Annulée' };
const INVOICE_STATUS_COLORS = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDateLong(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Repartit les options du plan reellement applique en "incluses" et "non
// incluses" (quota a 0 ou option desactivee), chaque option non incluse
// indiquant le 1er plan qui la debloque - le prestataire voit ainsi ce
// qu'apporterait un plan superieur. `plans` = catalogue complet (null = illimite).
function getFeatureLists(limits, plans) {
  const included = [];
  const locked = [];
  const quota = (field, unlimitedLabel, countLabel, featureName) => {
    const value = limits[field];
    if (isUnlimited(value)) included.push(unlimitedLabel);
    else if (Number(value) > 0) included.push(countLabel(value));
    else locked.push({ label: featureName, requiredPlan: cheapestPlanAbove(plans, field, 0) });
  };

  quota('maxPhotos', 'Photos illimitées', (n) => `Jusqu'à ${n} photos`, 'Photos');
  quota('maxVideos', 'Vidéos illimitées', (n) => `Jusqu'à ${n} vidéos`, 'Vidéos');
  quota(
    'maxPromotions',
    'Promotions illimitées',
    (n) => `${n} promotion(s) active(s) max`,
    'Promotions'
  );

  if (isUnlimited(limits.maxCategories)) {
    included.push('Catégories de recherche illimitées');
  } else {
    included.push(`${limits.maxCategories} catégorie(s) de recherche`);
    if (Number(limits.maxCategories) <= 1) {
      locked.push({
        label: 'Catégories supplémentaires',
        requiredPlan: cheapestPlanAbove(plans, 'maxCategories', 1),
      });
    }
  }

  if (limits.eventsEnabled) included.push('Mes événements');
  else locked.push({ label: 'Mes événements', requiredPlan: cheapestPlanLabel(plans, (p) => p.eventsEnabled) });

  if (limits.calendarEnabled) included.push('Calendrier des disponibilités');
  else {
    locked.push({
      label: 'Calendrier des disponibilités',
      requiredPlan: cheapestPlanLabel(plans, (p) => p.calendarEnabled),
    });
  }

  if (limits.featured) included.push('Mise en avant dans les résultats de recherche');
  else {
    locked.push({
      label: 'Mise en avant dans les résultats de recherche',
      requiredPlan: cheapestPlanLabel(plans, (p) => p.featured),
    });
  }

  return { included, locked };
}

function SubscriptionTab() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMySubscription()
      .then(setSubscription)
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger votre abonnement.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (!subscription) return <p className="text-sm text-red-600">{error}</p>;

  // `limits` = plan souscrit (badge/reference facturation) ; les
  // fonctionnalites listees ci-dessous reflètent `effectiveLimits` (Starter
  // si expire, voir subscriptionController.toPublicSubscription) pour rester
  // coherentes avec ce que le backend applique reellement.
  const limits = subscription.plans[subscription.plan];
  const effectiveLimits = subscription.plans[subscription.effectivePlan];
  const { included: features, locked: lockedFeatures } = getFeatureLists(
    effectiveLimits,
    subscription.plans
  );
  // Le statut affiche prime sur le champ brut en base : une echeance depassee
  // desactive l'usage meme si personne n'a repasse le statut a "expired".
  const displayStatus = subscription.isExpired ? 'expired' : subscription.status;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Facturation</h2>
      <p className="mt-1 text-sm text-gray-500">Votre plan actuel</p>

      <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${PLAN_COLORS[subscription.plan]}`}>
              {limits.label}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[displayStatus]}`}>
              {STATUS_LABELS[displayStatus]}
            </span>
          </div>
          <span className="text-sm text-gray-400">{BILLING_LABELS[subscription.billingCycle]}</span>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          {subscription.endDate
            ? `Expire le ${formatDateLong(subscription.endDate)}`
            : 'Aucune échéance (plan gratuit)'}
        </p>

        {subscription.isExpired && subscription.plan !== 'starter' && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Votre abonnement {limits.label} est expiré. Vous êtes actuellement limité aux
            fonctionnalités du plan Starter — contactez l&apos;administrateur pour le renouveler.
          </p>
        )}

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
          Fonctionnalités {subscription.isExpired ? 'actuellement actives' : 'incluses'}
        </p>
        <ul className="mt-2 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
              <IconCheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        {lockedFeatures.length > 0 && (
          <>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
              Non inclus dans votre plan
            </p>
            <ul className="mt-2 space-y-2">
              {lockedFeatures.map((feature) => (
                <li key={feature.label} className="flex items-start gap-2 text-sm text-gray-400">
                  <IconLock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {feature.label}
                    {feature.requiredPlan && (
                      <span className="ml-1 text-xs">· à partir du plan {feature.requiredPlan}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
          Pour changer de plan, contactez l&apos;administrateur.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <IconFileText className="h-4 w-4 text-gray-400" />
            Historique des factures
          </div>
          <span className="text-xs text-gray-400">{subscription.invoices.length} facture(s)</span>
        </div>

        {subscription.invoices.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-500">Aucune facture pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">N° Facture</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Période</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscription.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-5 py-3 text-gray-600">{invoice.issuedAt}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {invoice.issuedAt} — {invoice.dueDate || '—'}
                    </td>
                    <td className="px-5 py-3 font-medium text-rose-600">
                      {Number(invoice.amount).toFixed(3)} DT
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          INVOICE_STATUS_COLORS[invoice.status]
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            openDocument(invoice.pdfUrl);
                          }}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <IconDownload className="h-3.5 w-3.5" />
                          Télécharger PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Aucun paiement en ligne : le règlement se fait hors plateforme (cash ou virement RIB).
        L&apos;activation et la facturation sont gérées manuellement par notre équipe.
      </p>
    </div>
  );
}

export default SubscriptionTab;
