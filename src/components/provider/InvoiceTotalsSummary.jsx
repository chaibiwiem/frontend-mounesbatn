import { computeInvoiceTotals, formatDt } from '../../utils/invoiceTotals';

// Recapitulatif calcule en direct sous le formulaire de facture : HT, TVA,
// TTC, acompte et reste a payer - identique aux totaux imprimes sur le PDF.
function InvoiceTotalsSummary({ amount, taxRate, deposit }) {
  const totals = computeInvoiceTotals({ amount, taxRate, deposit });

  return (
    <div className="space-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Total HT</span>
        <span>{formatDt(totals.ht)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>TVA{totals.taxRate > 0 ? ` ${totals.taxRate}%` : ''}</span>
        <span>{totals.taxRate > 0 ? formatDt(totals.tva) : '—'}</span>
      </div>
      <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900">
        <span>Total TTC</span>
        <span>{formatDt(totals.ttc)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Acompte versé</span>
        <span>{totals.deposit > 0 ? `− ${formatDt(totals.deposit)}` : '—'}</span>
      </div>
      <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-bold text-rose-600">
        <span>Reste à payer</span>
        <span>{formatDt(totals.remaining)}</span>
      </div>
      {totals.depositTooHigh && (
        <p className="text-xs text-red-600">L&apos;acompte ne peut pas dépasser le total TTC.</p>
      )}
    </div>
  );
}

export default InvoiceTotalsSummary;
