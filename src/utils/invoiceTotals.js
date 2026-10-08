// Meme calcul que backend/src/utils/invoiceTotals.js (PDF + validation) :
// seuls le montant HT, le taux de TVA et l'acompte sont saisis, le reste est
// toujours recalcule.
const round2 = (value) => Math.round(value * 100) / 100;

export function computeInvoiceTotals({ amount, taxRate, deposit }) {
  const ht = Number(amount) || 0;
  const rate = Number(taxRate) || 0;
  const tva = round2((ht * rate) / 100);
  const ttc = round2(ht + tva);
  const paid = Number(deposit) || 0;
  const remaining = round2(Math.max(ttc - paid, 0));
  return { ht: round2(ht), taxRate: rate, tva, ttc, deposit: round2(paid), remaining, depositTooHigh: paid > ttc };
}

export const formatDt = (value) => `${Number(value || 0).toFixed(2)} DT`;
