import { useEffect, useState } from 'react';
import { getCategories, getCities } from '../../services/listingService';
import { createProvider, getCategoriesAdmin } from '../../services/adminService';
import { formatFeeRate } from '../../services/connectionFeeService';
import {
  resolveFeeCategory,
  connectionFeeTerms,
  CONNECTION_FEE_TERMS_VERSION,
} from '../../utils/connectionFeeTerms';
import { formatTunisianPhone, stripPhoneSpaces } from '../../utils/phone';

const MAX_PHOTOS = 20;
const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';
const PHONE_FIELDS = ['phone', 'businessPhone'];

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  city: '',
  address: '',
  businessPhone: '',
  taxId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

function CreateProviderForm({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [cinDocument, setCinDocument] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState('');
  // Frais de mise en relation (M13) : arbre admin (avec les tarifs) pour
  // savoir si la categorie choisie est concernee -> acceptation obligatoire.
  const [adminCategories, setAdminCategories] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
    getCategoriesAdmin()
      .then(setAdminCategories)
      .catch(() => setAdminCategories([]));
  }, []);

  const feeCategory = form.categoryId ? resolveFeeCategory(adminCategories, form.categoryId) : null;

  const flatCategories = categories.flatMap((cat) => [cat, ...cat.children]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: PHONE_FIELDS.includes(name) ? formatTunisianPhone(value) : value,
    }));
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_PHOTOS) {
      setError(`Vous pouvez joindre au maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    const invalid = files.find(
      (file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024
    );
    if (invalid) {
      setError('Chaque photo doit être en JPG/PNG et faire moins de 5 Mo.');
      return;
    }
    setError('');
    setPhotos(files);
  };

  const handleCinDocumentChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('La carte CIN doit être en JPG/PNG et faire moins de 5 Mo.');
      return;
    }
    setError('');
    setCinDocument(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.categoryId || !form.firstName.trim() || !form.lastName.trim()) {
      setError('Merci de remplir les champs obligatoires (*).');
      return;
    }
    if (feeCategory && !termsAccepted) {
      setError("Cette catégorie est soumise aux frais de mise en relation : l'acceptation des conditions est obligatoire.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProvider({
        ...form,
        phone: stripPhoneSpaces(form.phone),
        businessPhone: stripPhoneSpaces(form.businessPhone),
        connectionFeeTermsAccepted: feeCategory ? termsAccepted : undefined,
        photos,
        cinDocument,
      });
      setSuccess(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de créer ce prestataire.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Ajouter un prestataire</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            ✕
          </button>
        </div>

        {success ? (
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Prestataire <strong>{success.listing.title}</strong> créé et fiche active.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Ses identifiants lui ont été envoyés par email. Vous pouvez aussi les lui
              communiquer directement (téléphone, SMS, WhatsApp) — il pourra changer ce mot de
              passe depuis son espace prestataire.
            </p>
            <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0">
                  <span className="font-medium text-gray-700">Email : </span>
                  <span className="break-all">{success.user.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(success.user.email);
                    setCopied('email');
                  }}
                  className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  {copied === 'email' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p>
                  <span className="font-medium text-gray-700">Mot de passe temporaire : </span>
                  <span className="font-mono font-semibold text-rose-600">
                    {success.temporaryPassword}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(success.temporaryPassword);
                    setCopied('password');
                  }}
                  className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  {copied === 'password' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email : ${success.user.email}\nMot de passe temporaire : ${success.temporaryPassword}`
                  );
                  setCopied('both');
                }}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {copied === 'both' ? 'Copié !' : 'Copier les deux (email + mot de passe)'}
              </button>
            </div>
            <button
              type="button"
              onClick={onSuccess}
              className="mt-6 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Entreprise</h3>
              <div>
                <label className={labelClass}>Nom de l&apos;entreprise *</label>
                <input required name="title" value={form.title} onChange={handleChange} className={inputClass} />
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
                  <label className={labelClass}>Catégorie *</label>
                  <select required name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass}>
                    <option value="">Sélectionner...</option>
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
                    name="businessPhone"
                    value={form.businessPhone}
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
                  placeholder="ex : 1234567A/B/C/000"
                  className={inputClass}
                />
              </div>
            </div>

            {feeCategory && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-semibold text-amber-900">
                  Frais de mise en relation — {feeCategory.name} (version {CONNECTION_FEE_TERMS_VERSION})
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {connectionFeeTerms(formatFeeRate(feeCategory)).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <label className="flex items-start gap-2 text-sm font-medium text-gray-800">
                  <input required
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  Le prestataire a pris connaissance et accepte les conditions des frais de mise en relation *
                </label>
              </div>
            )}

            <div className="space-y-2 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Carte CIN du gérant (optionnel)</h3>
              <input type="file" accept="image/jpeg,image/png" onChange={handleCinDocumentChange} className="text-sm" />
              {cinDocument && <p className="text-xs text-gray-500">{cinDocument.name}</p>}
              <p className="text-xs text-gray-500">
                JPG/PNG uniquement, 5 Mo maximum. Document sensible — stocké de façon restreinte,
                jamais visible publiquement.
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Coordonnées du gérant</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prénom *</label>
                  <input required name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nom *</label>
                  <input required name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email *</label>
                  <input required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Téléphone *</label>
                  <input required
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
            </div>

            <div className="space-y-2 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Photos (optionnel, {MAX_PHOTOS} maximum)</h3>
              <input type="file" accept="image/jpeg,image/png" multiple onChange={handlePhotosChange} className="text-sm" />
              {photos.length > 0 && (
                <p className="text-xs text-gray-500">{photos.length} photo(s) sélectionnée(s)</p>
              )}
              <p className="text-xs text-gray-500">JPG/PNG uniquement, 5 Mo maximum par photo.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer le prestataire'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateProviderForm;
