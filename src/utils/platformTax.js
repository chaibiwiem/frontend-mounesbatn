// Factures Mounesba -> prestataire (abonnement, frais de mise en relation) :
// montant HORS TAXE + TVA 19 % ajoutee par-dessus. Meme calcul que le backend
// (backend/src/utils/platformTax.js). Ex. Pro 29 DT HT -> 34,51 DT TTC.
export const PLATFORM_TAX_RATE = 19;

const round2 = (value) => Math.round(value * 100) / 100;

export const computePlatformInvoiceTotals = (amountHt) => {
  const ht = round2(Number(amountHt) || 0);
  const tva = round2((ht * PLATFORM_TAX_RATE) / 100);
  return { ht, taxRate: PLATFORM_TAX_RATE, tva, ttc: round2(ht + tva) };
};
