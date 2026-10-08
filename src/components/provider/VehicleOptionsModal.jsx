import { useState } from 'react';
import { addVehicleOption, updateVehicleOption, deleteVehicleOption } from '../../services/vehicleService';
import { IconPlus, IconEdit, IconTrash, IconTag } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const emptyForm = { name: '', price: '', pricingType: 'per_day', maxQuantity: '1' };

// Gestion des options supplementaires (2eme conducteur, GPS, siege bebe...)
// d'un vehicule - le client les choisit (case a cocher ou quantite) lors de
// sa demande de location, voir ContactForm.
function VehicleOptionsModal({ vehicle, onClose, onChanged }) {
  const [options, setOptions] = useState(vehicle.options || []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (option) => {
    setEditingId(option.id);
    setForm({
      name: option.name || '',
      price: option.price || '',
      pricingType: option.pricingType || 'per_day',
      maxQuantity: String(option.maxQuantity || 1),
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError("Le nom de l'option est requis.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateVehicleOption(editingId, form);
        setOptions((prev) => prev.map((o) => (o.id === editingId ? updated : o)));
      } else {
        const created = await addVehicleOption(vehicle.id, form);
        setOptions((prev) => [...prev, created]);
      }
      setShowForm(false);
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer cette option."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (optionId) => {
    try {
      await deleteVehicleOption(optionId);
      setOptions((prev) => prev.filter((o) => o.id !== optionId));
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de retirer cette option.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            Options supplémentaires
            <span className="block text-sm font-normal text-gray-500">
              {vehicle.brand} {vehicle.model}
            </span>
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {options.length === 0 && !showForm && (
            <p className="text-sm text-gray-500">Aucune option supplémentaire pour le moment.</p>
          )}

          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <IconTag className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{option.name}</p>
                <p className="text-xs text-gray-500">
                  {option.price} DT {option.pricingType === 'flat' ? '(forfait)' : '/ jour'}
                  {option.maxQuantity > 1 ? ` · quantité jusqu'à ${option.maxQuantity}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(option)}
                  title="Modifier"
                  aria-label="Modifier"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(option.id)}
                  title="Retirer"
                  aria-label="Retirer"
                  className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-100 p-3">
              <div>
                <label className={labelClass}>Nom de l'option *</label>
                <input required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ex : GPS, 2ème conducteur, Siège bébé..."
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prix (DT)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tarification</label>
                  <select name="pricingType" value={form.pricingType} onChange={handleChange} className={inputClass}>
                    <option value="per_day">Par jour</option>
                    <option value="flat">Forfait unique</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Quantité maximum</label>
                <input
                  type="number"
                  name="maxQuantity"
                  min="1"
                  max="10"
                  value={form.maxQuantity}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  1 = case à cocher simple (ex. GPS). Plus de 1 = quantité sélectionnable (ex. sièges enfant).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={startAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-600 hover:border-rose-300 hover:text-rose-600"
            >
              <IconPlus className="h-4 w-4" />
              Ajouter une option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleOptionsModal;
