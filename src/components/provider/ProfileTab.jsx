import { useEffect, useRef, useState } from 'react';
import {
  getMyListing,
  updateMyListing,
  uploadListingLogo,
  deleteListingLogo,
  getCities,
} from '../../services/listingService';
import { changePassword } from '../../services/authService';
import CategoriesSection from './CategoriesSection';
import { formatTunisianPhone, stripPhoneSpaces } from '../../utils/phone';
import { withHttps } from '../../utils/safeUrl';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'priceFrom',
  'priceTo',
  'capacityMin',
  'capacity',
  'city',
  'address',
  'googleMapsUrl',
  'phone',
  'website',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'linkedinUrl',
  'whatsappUrl',
  'yearsExperience',
];

const initialPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ProfileTab({ logoUrl: logoUrlProp, onLogoChange }) {
  const [form, setForm] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [logoUrl, setLogoUrl] = useState(logoUrlProp || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    getMyListing()
      .then((listing) => {
        const initial = {};
        EDITABLE_FIELDS.forEach((field) => {
          initial[field] = listing[field] ?? '';
        });
        if (initial.phone) initial.phone = formatTunisianPhone(String(initial.phone));
        setForm(initial);
        setLogoUrl(listing.logoUrl || null);
      })
      .catch(() => setError('Impossible de charger votre fiche.'))
      .finally(() => setLoading(false));
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
  }, []);

  const updateLogo = (url) => {
    setLogoUrl(url);
    if (onLogoChange) onLogoChange(url);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoError('');
    try {
      const listing = await uploadListingLogo(file);
      updateLogo(listing.logoUrl);
    } catch (err) {
      setLogoError(err.response?.data?.message || "Impossible de televerser le logo.");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    setUploadingLogo(true);
    setLogoError('');
    try {
      await deleteListingLogo();
      updateLogo(null);
    } catch (err) {
      setLogoError(err.response?.data?.message || 'Impossible de supprimer le logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'phone' ? formatTunisianPhone(value) : value }));
  };

  // Lien saisi sans http(s):// : complete a la sortie du champ (type="url").
  const handleUrlBlur = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: withHttps(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateMyListing({ ...form, phone: stripPhoneSpaces(form.phone || '') });
      setMessage('Fiche mise à jour avec succès.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder les modifications.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage('Mot de passe modifié avec succès.');
      setPasswordForm(initialPasswordForm);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de changer le mot de passe.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (!form) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Mon profil</h2>

      <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        {logoUrl ? (
          <img loading="lazy" decoding="async"
            src={logoUrl}
            alt="Logo"
            className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white text-xs text-gray-400">
            Logo
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Logo de votre fiche</p>
          <p className="text-xs text-gray-500">JPG ou PNG, 5 Mo maximum.</p>
          {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploadingLogo ? 'Envoi...' : logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={handleLogoDelete}
                disabled={uploadingLogo}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className={labelClass}>Titre de la fiche</label>
          <input name="title" value={form.title} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={labelClass}>Adresse</label>
            <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Lien Google Maps</label>
          <input
            type="url"
            inputMode="url"
            name="googleMapsUrl"
            onBlur={handleUrlBlur}
            value={form.googleMapsUrl}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            Ouvrez votre fiche sur Google Maps, cliquez sur "Partager" puis collez le lien ici.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              type="tel"
              pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
              inputMode="tel"
              autoComplete="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+216 20 123 456"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Site web</label>
            <input type="url" inputMode="url" name="website" onBlur={handleUrlBlur} value={form.website} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Facebook</label>
            <input
              type="url"
              inputMode="url"
              name="facebookUrl"
              onBlur={handleUrlBlur}
              value={form.facebookUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input
              type="url"
              inputMode="url"
              name="instagramUrl"
              onBlur={handleUrlBlur}
              value={form.instagramUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>TikTok</label>
            <input
              type="url"
              inputMode="url"
              name="tiktokUrl"
              onBlur={handleUrlBlur}
              value={form.tiktokUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              type="url"
              inputMode="url"
              name="linkedinUrl"
              onBlur={handleUrlBlur}
              value={form.linkedinUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              type="url"
              inputMode="url"
              name="whatsappUrl"
              onBlur={handleUrlBlur}
              value={form.whatsappUrl}
              onChange={handleChange}
              placeholder="https://wa.me/216..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Capacité minimum (invités)</label>
            <input
              type="number"
              name="capacityMin"
              value={form.capacityMin}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Capacité maximum (invités)</label>
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
            <label className={labelClass}>Années d&apos;expérience</label>
            <input
              type="number"
              name="yearsExperience"
              value={form.yearsExperience}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      <CategoriesSection />

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-xl font-bold text-gray-900">Sécurité du compte</h2>
        <p className="mt-1 text-sm text-gray-500">
          Changez votre mot de passe (par exemple celui reçu lors de la création de votre compte).
        </p>

        <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
          <div>
            <label className={labelClass}>Mot de passe actuel</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nouveau mot de passe</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className={inputClass}
            />
          </div>

          {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {changingPassword ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileTab;
