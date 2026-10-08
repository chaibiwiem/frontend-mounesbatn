const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const formatAmount = (value) => `${Number(value || 0).toFixed(2)} DT`;

// Calcul automatique du montant d'une reservation (toutes categories) :
// prix de la prestation (hors sejour) ou chambres x nuits (sejour "Maison
// d'hote") + pack - remise = total. `totals` : resultat de computeBookingTotal
// (null tant qu'aucun prix n'est renseigne : montant saisi manuellement).
function StayPricingSummary({ totals, isStay, servicePrice, discountType, discountValue, onChange }) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      {!isStay && (
        <div>
          <label className={labelClass}>Prix de la prestation (DT)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={servicePrice}
            onChange={(e) => onChange({ servicePrice: e.target.value })}
            placeholder="Hors pack, ex : 800"
            className={inputClass}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Remise</label>
          <input
            type="number"
            min={0}
            step="0.01"
            max={discountType === 'percent' ? 100 : undefined}
            value={discountValue}
            onChange={(e) => onChange({ discountValue: e.target.value })}
            placeholder="0"
            disabled={!totals}
            className={`${inputClass} disabled:bg-gray-100`}
          />
        </div>
        <div>
          <label className={labelClass}>Type de remise</label>
          <select
            value={discountType}
            onChange={(e) => onChange({ discountType: e.target.value })}
            disabled={!totals}
            className={`${inputClass} disabled:bg-gray-100`}
          >
            <option value="amount">Montant (DT)</option>
            <option value="percent">Pourcentage (%)</option>
          </select>
        </div>
      </div>

      {!totals ? (
        <p className="text-xs text-gray-500">
          {isStay
            ? 'Renseignez le prix des chambres ou choisissez un pack'
            : 'Renseignez le prix de la prestation ou choisissez un pack'}{' '}
          pour calculer automatiquement le montant total (remise comprise).
        </p>
      ) : (
        <dl className="space-y-1 text-sm">
          {totals.roomsAmount > 0 && (
            <div className="flex justify-between gap-3 text-gray-600">
              <dt>
                Chambres : {formatAmount(totals.perNight)} / nuit × {totals.nights} nuit{totals.nights > 1 ? 's' : ''}
              </dt>
              <dd className="whitespace-nowrap">{formatAmount(totals.roomsAmount)}</dd>
            </div>
          )}
          {totals.serviceAmount > 0 && (
            <div className="flex justify-between gap-3 text-gray-600">
              <dt>Prestation</dt>
              <dd className="whitespace-nowrap">{formatAmount(totals.serviceAmount)}</dd>
            </div>
          )}
          {totals.packAmount > 0 && (
            <div className="flex justify-between gap-3 text-gray-600">
              <dt>Pack</dt>
              <dd className="whitespace-nowrap">{formatAmount(totals.packAmount)}</dd>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between gap-3 text-rose-600">
              <dt>Remise{discountType === 'percent' ? ` (${Number(discountValue)} %)` : ''}</dt>
              <dd className="whitespace-nowrap">- {formatAmount(totals.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-gray-200 pt-1 font-semibold text-gray-900">
            <dt>Montant total</dt>
            <dd className="whitespace-nowrap">{formatAmount(totals.total)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default StayPricingSummary;
