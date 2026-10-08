const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500';
const labelClass = 'block text-sm font-medium text-gray-700';

// Frais de mise en relation d'une categorie (M13) : activation + forfait fixe
// (DT) ou pourcentage (%) du montant du contrat declare par le prestataire.
// Une modification ne s'applique qu'aux futures demandes confirmees.
function CategoryFeeFields({ value, onChange }) {
  const isPercent = value.commissionType === 'percent';

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label className="flex items-start gap-2 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          checked={value.commissionEnabled}
          onChange={(e) => onChange({ ...value, commissionEnabled: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
        />
        Frais de mise en relation sur les demandes abouties
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Type</label>
          <select
            value={value.commissionType}
            onChange={(e) => onChange({ ...value, commissionType: e.target.value })}
            disabled={!value.commissionEnabled}
            className={inputClass}
          >
            <option value="fixed">Forfait fixe (DT)</option>
            <option value="percent">Pourcentage (%)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{isPercent ? 'Taux (%)' : 'Montant (DT)'}</label>
          <input
            type="number"
            min={0}
            max={isPercent ? 100 : undefined}
            step="0.01"
            value={value.commissionValue}
            onChange={(e) => onChange({ ...value, commissionValue: e.target.value })}
            disabled={!value.commissionEnabled}
            placeholder={isPercent ? 'ex : 5' : 'ex : 150'}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {isPercent
          ? 'Calculé sur le montant du contrat que le prestataire déclare (obligatoire) en confirmant la demande.'
          : 'Montant identique pour chaque demande aboutie, quel que soit le montant du contrat.'}{' '}
        S&apos;applique aussi aux sous-catégories, sauf si elles ont leur propre tarif.
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Une modification ne s&apos;applique qu&apos;aux futures demandes confirmées : les frais déjà engagés
        conservent le tarif en vigueur au moment de leur confirmation.
      </p>
    </div>
  );
}

export const feeFieldsFromCategory = (category) => ({
  commissionEnabled: Boolean(category?.commissionEnabled),
  commissionType: category?.commissionType || 'fixed',
  commissionValue: category?.commissionValue ?? '',
});

export const feePayload = (value) => ({
  commissionEnabled: value.commissionEnabled,
  commissionType: value.commissionType,
  commissionValue: value.commissionEnabled ? value.commissionValue : null,
});

export default CategoryFeeFields;
