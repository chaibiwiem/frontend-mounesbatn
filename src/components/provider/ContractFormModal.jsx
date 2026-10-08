import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

function ContractFormModal({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: '',
    object: '',
    amount: '',
    deposit: '',
    paymentMode: 'cash',
    terms: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.object.trim()) {
      setError("L'objet du contrat est requis.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de créer ce contrat.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Créer un contrat</h3>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Document déclaratif. Aucun paiement n'est traité par la plateforme.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Client</label>
            <select name="clientId" value={form.clientId} onChange={handleChange} className={inputClass}>
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Objet *</label>
            <input required
              name="object"
              value={form.object}
              onChange={handleChange}
              placeholder="ex: Animation DJ mariage du 12/09"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Acompte (DT)</label>
              <input
                type="number"
                name="deposit"
                value={form.deposit}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Mode de règlement</label>
            <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className={inputClass}>
              <option value="cash">Espèces</option>
              <option value="rib">Virement (RIB)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Conditions particulières</label>
            <textarea
              name="terms"
              value={form.terms}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer le contrat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractFormModal;
