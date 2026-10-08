import { useState } from 'react';
import {
  addVehicleDecoration,
  updateVehicleDecoration,
  deleteVehicleDecoration,
} from '../../services/vehicleService';
import { IconPlus, IconEdit, IconTrash, IconFlower } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const emptyForm = { name: '', description: '', price: '' };

// Gestion des modeles de decoration (photo/nom/prix) d'un vehicule - le
// client en choisit un parmi ceux-ci via un popup dedie cote public
// (DecorationPickerModal), style "carte + case a cocher".
function VehicleDecorationsModal({ vehicle, onClose, onChanged }) {
  const [decorations, setDecorations] = useState(vehicle.decorations || []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImage(null);
    setShowForm(true);
  };

  const startEdit = (decoration) => {
    setEditingId(decoration.id);
    setForm({
      name: decoration.name || '',
      description: decoration.description || '',
      price: decoration.price || '',
    });
    setImage(null);
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
      setError('Le nom du modèle est requis.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateVehicleDecoration(editingId, { ...form, image });
        setDecorations((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      } else {
        const created = await addVehicleDecoration(vehicle.id, { ...form, image });
        setDecorations((prev) => [...prev, created]);
      }
      setShowForm(false);
      onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer ce modèle."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (decorationId) => {
    try {
      await deleteVehicleDecoration(decorationId);
      setDecorations((prev) => prev.filter((d) => d.id !== decorationId));
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de retirer ce modèle.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            Modèles de décoration
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

          {decorations.length === 0 && !showForm && (
            <p className="text-sm text-gray-500">Aucun modèle de décoration pour le moment.</p>
          )}

          {decorations.map((decoration) => (
            <div
              key={decoration.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
            >
              {decoration.imageUrl ? (
                <img loading="lazy" decoding="async" src={decoration.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
                  <IconFlower className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{decoration.name}</p>
                {decoration.price && <p className="text-xs text-rose-600">{decoration.price} DT</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(decoration)}
                  title="Modifier"
                  aria-label="Modifier"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(decoration.id)}
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
                <label className={labelClass}>Nom du modèle *</label>
                <input required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ex : Fleurs blanches et rubans satin"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </div>
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
                <label className={labelClass}>Photo (optionnel)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="mt-1 text-sm"
                />
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
              Ajouter un modèle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleDecorationsModal;
