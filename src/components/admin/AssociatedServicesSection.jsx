import { useState } from 'react';
import {
  createAssociatedService,
  updateAssociatedService,
  deleteAssociatedService,
} from '../../services/adminService';
import { IconEdit, IconTrash, IconPlus } from '../icons';

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function ServiceRow({ service, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nameFr: service.nameFr, nameAr: service.nameAr || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(service.id, form);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={form.nameFr}
            onChange={(e) => setForm((prev) => ({ ...prev, nameFr: e.target.value }))}
            placeholder="Nom (FR)"
            className={`${inputClass} flex-1`}
            style={{ minWidth: '160px' }}
          />
          <input
            value={form.nameAr}
            onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
            placeholder="Nom (AR)"
            dir="rtl"
            className={`${inputClass} flex-1`}
            style={{ minWidth: '160px' }}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
      <p className="text-sm text-gray-900">
        {service.nameFr}
        {service.nameAr && <span className="ml-2 text-gray-400">· {service.nameAr}</span>}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Modifier"
          aria-label="Modifier"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <IconEdit className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(service)}
          title="Supprimer"
          aria-label="Supprimer"
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Services complementaires informatifs (FR/AR), affiches sur la fiche
// publique d'une categorie principale (ex. "Location de salle de conference"
// pour "Evenements professionnels") - distincts des sous-categories, aucun
// prestataire n'y est rattache.
function AssociatedServicesSection({ categoryId, services, onChange }) {
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ nameFr: '', nameAr: '' });
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState('');

  const handleSave = async (id, payload) => {
    await updateAssociatedService(id, payload);
    onChange();
  };

  const handleDelete = async (service) => {
    try {
      await deleteAssociatedService(service.id);
      onChange();
    } catch {
      // Erreur affichee au niveau parent via son propre etat, pas geree ici.
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.nameFr.trim()) return;
    setSavingNew(true);
    setNewError('');
    try {
      await createAssociatedService(categoryId, newForm);
      setNewForm({ nameFr: '', nameAr: '' });
      setAdding(false);
      onChange();
    } catch (err) {
      setNewError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible d\'ajouter ce service.'
      );
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Services associés</p>
      <p className="mt-1 text-xs text-gray-400">
        Liste informative (FR/AR) affichée sur la page catégorie — pas des sous-catégories, aucun
        prestataire n'y est rattaché.
      </p>

      <div className="mt-3 space-y-2">
        {services.length === 0 && !adding && (
          <p className="text-sm text-gray-400">Aucun service associé.</p>
        )}
        {services.map((service) => (
          <ServiceRow key={service.id} service={service} onSave={handleSave} onDelete={handleDelete} />
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleCreate} className="mt-3 rounded-xl border border-dashed border-rose-200 p-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={newForm.nameFr}
              onChange={(e) => setNewForm((prev) => ({ ...prev, nameFr: e.target.value }))}
              placeholder="Nom (FR)"
              autoFocus
              className={`${inputClass} flex-1`}
              style={{ minWidth: '160px' }}
            />
            <input
              value={newForm.nameAr}
              onChange={(e) => setNewForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder="Nom (AR)"
              dir="rtl"
              className={`${inputClass} flex-1`}
              style={{ minWidth: '160px' }}
            />
          </div>
          {newError && <p className="mt-1.5 text-xs text-red-600">{newError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={savingNew}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {savingNew ? 'Ajout...' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewError('');
              }}
              disabled={savingNew}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-rose-200 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          <IconPlus className="h-4 w-4" />
          Ajouter un service associé
        </button>
      )}
    </div>
  );
}

export default AssociatedServicesSection;
