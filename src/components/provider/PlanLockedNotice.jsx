import { IconLock } from '../icons';

// Encart "option non incluse dans votre plan" du dashboard prestataire :
// l'option reste visible (pour montrer ce qu'apporte un plan superieur) mais
// desactivee. `requiredPlan` = libelle du 1er plan qui la debloque (voir
// utils/planFeatures.cheapestPlanLabel), null si aucun plan ne la propose.
function PlanLockedNotice({ feature, currentPlan, requiredPlan, onUpgrade, compact = false }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 ${
        compact ? 'px-3 py-2' : 'px-4 py-4'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
        <IconLock className="h-4 w-4" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-gray-800">
          {feature} : non inclus dans votre plan {currentPlan}
        </p>
        <p className="mt-0.5 text-gray-500">
          {requiredPlan
            ? `Disponible à partir du plan ${requiredPlan}.`
            : "Cette option n'est proposée dans aucun plan pour le moment."}{' '}
          {requiredPlan && onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="font-semibold text-[#4E8BC4] hover:underline"
            >
              Voir mon abonnement
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

export default PlanLockedNotice;
