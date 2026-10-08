import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4E8BC4] focus:outline-none focus:ring-1 focus:ring-[#4E8BC4]';
const labelClass = 'block text-xs font-medium text-gray-700';

const TYPE_LABELS = {
  portes_ouvertes: 'Journée portes ouvertes',
  show_cooking: 'Show cooking',
  defile: 'Défilé de mode',
  lancement: 'Lancement',
  degustation: 'Dégustation',
  autre: 'Autre',
};

// "Mes evenements" (M5) : creation/edition d'un evenement organise PAR le
// prestataire - lieu pre-rempli avec l'adresse de la fiche (modifiable),
// enregistrement en brouillon ou publication directe (deux boutons).
function EventFormModal({ event, defaultLocation, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    type: event?.type || 'autre',
    description: event?.description || '',
    eventDate: event?.eventDate || '',
    startTime: event?.startTime?.slice(0, 5) || '',
    endTime: event?.endTime?.slice(0, 5) || '',
    location: event?.location ?? defaultLocation ?? '',
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (isPublished) => {
    setError('');
    if (!form.title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    if (!form.eventDate) {
      setError('La date est requise.');
      return;
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({ ...form, image, isPublished });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer cet événement."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-[#2C3E50]">
            {event ? "Modifier l'événement" : 'Créer un événement'}
          </h3>
        </div>

        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div>
              <label className={labelClass}>Titre *</label>
              <input required
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="ex : Journée portes ouvertes"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Type</label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Date *</label>
                <input required
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Heure début</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Heure fin</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Lieu</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Adresse de l'événement"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Photo {event?.imageUrl ? '(remplacer)' : '(optionnel)'}</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="mt-1 text-sm"
              />
              {event?.imageUrl && !image && (
                <img loading="lazy" decoding="async" src={event.imageUrl} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-[#4E8BC4] py-2.5 text-sm font-semibold text-[#4E8BC4] hover:bg-[#4E8BC4]/5 disabled:opacity-50"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#4E8BC4] py-2.5 text-sm font-semibold text-white hover:bg-[#3f74a3] disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;
