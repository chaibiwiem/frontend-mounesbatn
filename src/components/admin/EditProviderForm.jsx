import { useEffect, useState } from 'react';
import { getCategories, getCities } from '../../services/listingService';
import { updateProvider, getProviderCin, uploadProviderCin, deleteProviderCin } from '../../services/adminService';
import { formatTunisianPhone, stripPhoneSpaces } from '../../utils/phone';
import { withHttps } from '../../utils/safeUrl';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'categoryId',
  'city',
  'address',
  'phone',
  'priceFrom',
  'priceTo',
  'avgSpent',
  'capacity',
  'website',
  'facebookUrl',
  'instagramUrl',
  'yearsExperience',
  'languages',
  'taxId',
];

const PHONE_FIELDS = ['phone', 'ownerPhone'];
const MAX_CIN_SIZE = 5 * 1024 * 1024;

function EditProviderForm({ listing, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(() => {
    const initial = {};
    EDITABLE_FIELDS.forEach((field) => {
      initial[field] = listing[field] ?? '';
    });
    initial.phone = initial.phone ? formatTunisianPhone(String(initial.phone)) : '';
    // Coordonnees du gerant (compte proprietaire de la fiche).
    initial.ownerFirstName = listing.owner?.firstName || '';
    initial.ownerLastName = listing.owner?.lastName || '';
    initial.ownerEmail = listing.owner?.email || '';
    initial.ownerPhone = listing.owner?.phone ? formatTunisianPhone(listing.owner.phone) : '';
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Carte CIN : etat local (presente ou non), nouveau fichier choisi a
  // envoyer a l'enregistrement, apercu via URL objet (jamais d'URL publique).
  const [hasCin, setHasCin] = useState(Boolean(listing.cinDocumentUrl));
  const [cinFile, setCinFile] = useState(null);
  const [cinPreviewUrl, setCinPreviewUrl] = useState('');
  const [cinBusy, setCinBusy] = useState(false);
  const [cinError, setCinError] = useState('');

  useEffect(() => () => cinPreviewUrl && URL.revokeObjectURL(cinPreviewUrl), [cinPreviewUrl]);

  const handleViewCin = async () => {
    setCinError('');
    setCinBusy(true);
    try {
      const blob = await getProviderCin(listing.id);
      setCinPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setCinError('Impossible de charger la carte CIN.');
    } finally {
      setCinBusy(false);
    }
  };

  const handleCinFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCinError('');
    if (file && (!['image/jpeg', 'image/png'].includes(file.type) || file.size > MAX_CIN_SIZE)) {
      setCinError('La carte CIN doit être en JPG/PNG et faire moins de 5 Mo.');
      e.target.value = '';
      return;
    }
    setCinFile(file);
    if (cinPreviewUrl) URL.revokeObjectURL(cinPreviewUrl);
    setCinPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleDeleteCin = async () => {
    if (!window.confirm('Supprimer définitivement la carte CIN de ce prestataire ?')) return;
    setCinError('');
    setCinBusy(true);
    try {
      await deleteProviderCin(listing.id);
      setHasCin(false);
      setCinFile(null);
      if (cinPreviewUrl) URL.revokeObjectURL(cinPreviewUrl);
      setCinPreviewUrl('');
    } catch (err) {
      setCinError(err.response?.data?.message || 'Impossible de supprimer la carte CIN.');
    } finally {
      setCinBusy(false);
    }
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
  }, []);

  const flatCategories = categories.flatMap((cat) => [cat, ...cat.children]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: PHONE_FIELDS.includes(name) ? formatTunisianPhone(value) : value }));
  };

  // Lien saisi sans http(s):// : complete a la sortie du champ (type="url").
  const handleUrlBlur = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: withHttps(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.ownerFirstName.trim() || !form.ownerLastName.trim() || !form.ownerEmail.trim()) {
      setError('Prénom, nom et email du gérant sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      await updateProvider(listing.id, {
        ...form,
        phone: stripPhoneSpaces(form.phone),
        ownerPhone: stripPhoneSpaces(form.ownerPhone),
      });
      if (cinFile) await uploadProviderCin(listing.id, cinFile);
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de modifier cette fiche.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Modifier la fiche</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Nom de l&apos;entreprise</label>
            <input name="title" value={form.title} onChange={handleChange} className={inputClass} />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Catégorie</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass}>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ville / région</label>
              <select name="city" value={form.city} onChange={handleChange} className={inputClass}>
                <option value="">Sélectionner...</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Adresse</label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone entreprise</label>
              <input
                type="tel"
                pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
                inputMode="tel"
                autoComplete="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+216 58 799 209"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Matricule fiscale</label>
            <input
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              maxLength={40}
              placeholder="ex : 1234567A/B/C/000"
              className={inputClass}
            />
          </div>

          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">Coordonnées du gérant</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input required name="ownerFirstName" value={form.ownerFirstName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input required name="ownerLastName" value={form.ownerLastName} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email *</label>
                <input required
                  type="email"
                  name="ownerEmail"
                  value={form.ownerEmail}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input
                  type="tel"
                  pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
                  inputMode="tel"
                  autoComplete="tel"
                  name="ownerPhone"
                  value={form.ownerPhone}
                  onChange={handleChange}
                  placeholder="+216 58 799 209"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              L&apos;email est aussi l&apos;identifiant de connexion du prestataire.
            </p>
          </div>

          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">Carte CIN du gérant</h3>
            <p className="text-sm text-gray-600">
              {cinFile
                ? `Nouveau fichier : ${cinFile.name} (enregistré à la validation)`
                : hasCin
                  ? 'Carte CIN enregistrée.'
                  : 'Aucune carte CIN enregistrée.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {hasCin && !cinFile && (
                <button
                  type="button"
                  onClick={handleViewCin}
                  disabled={cinBusy}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Voir
                </button>
              )}
              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {hasCin || cinFile ? 'Remplacer' : 'Ajouter'}
                <input type="file" accept="image/jpeg,image/png" onChange={handleCinFileChange} className="hidden" />
              </label>
              {hasCin && (
                <button
                  type="button"
                  onClick={handleDeleteCin}
                  disabled={cinBusy}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Supprimer
                </button>
              )}
            </div>
            {cinPreviewUrl && (
              <img src={cinPreviewUrl} alt="Carte CIN" className="mt-2 max-h-64 rounded-lg border border-gray-200" />
            )}
            {cinError && <p className="text-sm text-red-600">{cinError}</p>}
            <p className="text-xs text-gray-500">
              JPG/PNG, 5 Mo maximum. Document sensible — stocké de façon restreinte, jamais visible publiquement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Prix de départ (DT)</label>
              <input
                type="number"
                name="priceFrom"
                value={form.priceFrom}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prix maximum (DT)</label>
              <input
                type="number"
                name="priceTo"
                value={form.priceTo}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Capacité (invités)</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Site web</label>
              <input type="url" inputMode="url" name="website" onBlur={handleUrlBlur} value={form.website} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Langues parlées</label>
              <input name="languages" value={form.languages} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProviderForm;
