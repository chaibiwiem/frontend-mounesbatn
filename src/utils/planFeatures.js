// Aides partagees par le dashboard prestataire pour afficher les options
// verrouillees par le plan d'abonnement. `plans` = catalogue renvoye par
// GET /api/subscriptions/me (subscription.plans) : une limite `null` y signifie
// illimite (Infinity cote backend, serialise en null par JSON).

export const isUnlimited = (value) => value === null || value === undefined;

// Limite numerique utilisable en comparaison (null -> Infinity).
export const limitValue = (value) => (isUnlimited(value) ? Infinity : Number(value));

// Libelle du plan le moins cher qui satisfait `predicate` (ex. qui inclut les
// evenements), ou null si aucun plan ne le propose.
export function cheapestPlanLabel(plans, predicate) {
  if (!plans) return null;
  const match = Object.values(plans)
    .filter(Boolean)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .find(predicate);
  return match ? match.label : null;
}

// Plan le moins cher dont la limite `field` depasse `current` (ex. le 1er plan
// avec plus de 0 video).
export const cheapestPlanAbove = (plans, field, current) =>
  cheapestPlanLabel(plans, (plan) => limitValue(plan[field]) > current);
