import { useState } from 'react';
import { sendContract } from '../../services/contractService';
import { IconSend } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'signed', label: 'Signé' },
  { value: 'cancelled', label: 'Annulé' },
];

function ContractEditModal({ contract, onSave, onCancel }) {
  const [form, setForm] = useState({
    object: contract.object || '',
    amount: contract.amount ?? '',
    deposit: contract.deposit ?? '',
    paymentMode: contract.paymentMode || 'cash',
    status: contract.status,
    terms: contract.terms || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de mettre à jour ce contrat.'
      );
      setSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setError('');
    setSendMessage('');
    try {
      await sendContract(contract.id);
      setSendMessage('Contrat envoyé au client par email.');
      setForm((prev) => ({ ...prev, status: 'sent' }));
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer ce contrat.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier le contrat</h3>
        <p className="mt-1 text-sm text-gray-500">{contract.client?.name || 'Client non spécifié'}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Objet *</label>
            <input required name="object" value={form.object} onChange={handleChange} className={inputClass} />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mode de règlement</label>
              <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className={inputClass}>
                <option value="cash">Espèces</option>
                <option value="rib">Virement (RIB)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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

          {contract.status === 'draft' && (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <IconSend className="h-4 w-4" />
              {sending ? 'Envoi...' : 'Envoyer ce contrat au client par email'}
            </button>
          )}
          {sendMessage && <p className="text-sm text-green-600">{sendMessage}</p>}

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
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractEditModal;
