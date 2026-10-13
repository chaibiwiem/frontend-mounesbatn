// Conditions de referencement - frais de mise en relation (MODULES.md M13).
// Doit rester alignee sur TERMS_VERSION du backend
// (backend/src/services/connectionFeeService.js) : toute modification du
// texte impose une nouvelle version, re-acceptee par les prestataires.
export const CONNECTION_FEE_TERMS_VERSION = '2026-10-v1';

// Categorie dont le tarif s'applique (meme regle que le backend,
// connectionFeeService.resolveFeeCategory) : la sous-categorie si elle est
// concernee, sinon sa categorie principale. `tree` : arbre admin des
// categories (GET /admin/categories, avec les champs de frais).
export const resolveFeeCategory = (tree, categoryId) => {
  const isConcerned = (cat) => cat?.commissionEnabled && Number(cat.commissionValue) > 0;
  for (const parent of tree || []) {
    if (String(parent.id) === String(categoryId)) return isConcerned(parent) ? parent : null;
    const child = (parent.children || []).find((c) => String(c.id) === String(categoryId));
    if (child) {
      if (isConcerned(child)) return child;
      return isConcerned(parent) ? parent : null;
    }
  }
  return null;
};

// `rateLabel` : tarif lisible (formatFeeRate), ex. "150.00 DT" ou
// "10 % du montant du contrat".
export const connectionFeeTerms = (rateLabel) => [
  `Pour les catégories concernées, Mounesba facture au prestataire des frais de mise en relation${
    rateLabel ? ` (${rateLabel})` : ''
  } pour chaque demande reçue via la plateforme et ayant réellement abouti.`,
  "Les frais ne sont dus qu'après une double confirmation : vous déclarez la demande aboutie, puis Mounesba la valide.",
  'Lorsque les frais sont calculés en pourcentage, vous déclarez le montant du contrat à la confirmation ; au forfait fixe, ce montant est facultatif.',
  "Les frais validés sont regroupés dans une facture mensuelle, réglée hors plateforme (espèces ou virement). Aucun paiement n'a lieu sur Mounesba.",
  "Vous pouvez contester une ligne validée tant qu'elle n'est pas facturée.",
];
