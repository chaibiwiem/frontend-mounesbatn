import { useState } from 'react';
import { updateCategory } from '../../services/adminService';
import { formatFeeRate } from '../../services/connectionFeeService';
import CategoryFeeFields, { feeFieldsFromCategory, feePayload } from './CategoryFeeFields';

function FeeModal({ category, onClose, onSaved }) {
  const [value, setValue] = useState(feeFieldsFromCategory(category));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      await updateCategory(category.id, feePayload(value));
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Enregistrement impossible.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Frais de mise en relation — {category.name}</h3>
        <div className="mt-4">
          <CategoryFeeFields value={value} onChange={setValue} />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

const feeLabel = (category) =>
  category.commissionEnabled && Number(category.commissionValue) > 0
    ? category.commissionType === 'percent'
      ? formatFeeRate(category)
      : `Forfait ${formatFeeRate(category)}`
    : null;

// Gestion des categories concernees (M13) : activation et forfait fixe, par
// categorie principale (s'applique a ses sous-categories) ou sous-categorie.
function ConnectionFeeCategories({ tree, onChange }) {
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Une modification ne s&apos;applique qu&apos;aux futures demandes confirmées : chaque ligne de frais conserve
        le tarif en vigueur au moment de sa confirmation.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Frais de mise en relation</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tree.map((parent) => [parent, ...(parent.children || [])]).flat().map((category) => {
              const parent = tree.find((p) => p.id === category.parentId);
              const own = feeLabel(category);
              const inherited = !own && parent ? feeLabel(parent) : null;
              return (
                <tr key={category.id} className={category.parentId ? '' : 'bg-gray-50/60'}>
                  <td className={`px-4 py-2.5 ${category.parentId ? 'pl-10 text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {category.name}
                  </td>
                  <td className="px-4 py-2.5">
                    {own ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        {own}
                      </span>
                    ) : inherited ? (
                      <span className="text-xs text-gray-500">Hérité : {inherited}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Non concernée</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(category)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <FeeModal
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

export default ConnectionFeeCategories;
