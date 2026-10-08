import { useRef, useState } from 'react';
import {
  createCategory,
  updateCategory,
  uploadCategoryImage,
  deleteCategoryImage,
  uploadCategoryIcon,
  deleteCategoryIcon,
} from '../../services/adminService';
import { IconImage } from '../icons';
import CategoryFeeFields, { feeFieldsFromCategory, feePayload } from './CategoryFeeFields';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

function CategoryForm({ category, parentCategory, onClose, onSuccess }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    icon: category?.icon || '',
    sortOrder: category?.sortOrder ?? 0,
  });
  const [fees, setFees] = useState(feeFieldsFromCategory(category));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [imageUrl, setImageUrl] = useState(category?.imageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef(null);

  const [iconUrl, setIconUrl] = useState(category?.iconUrl || null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconError, setIconError] = useState('');
  const iconInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError('');
    try {
      const updated = await uploadCategoryImage(category.id, file);
      setImageUrl(updated.imageUrl);
    } catch (err) {
      setImageError(err.response?.data?.message || "Impossible de televerser l'image.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleImageDelete = async () => {
    setUploadingImage(true);
    setImageError('');
    try {
      await deleteCategoryImage(category.id);
      setImageUrl(null);
    } catch (err) {
      setImageError(err.response?.data?.message || "Impossible de supprimer l'image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    setIconError('');
    try {
      const updated = await uploadCategoryIcon(category.id, file);
      setIconUrl(updated.iconUrl);
    } catch (err) {
      setIconError(err.response?.data?.message || "Impossible de televerser l'icône.");
    } finally {
      setUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  const handleIconDelete = async () => {
    setUploadingIcon(true);
    setIconError('');
    try {
      await deleteCategoryIcon(category.id);
      setIconUrl(null);
    } catch (err) {
      setIconError(err.response?.data?.message || "Impossible de supprimer l'icône.");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Le nom et le slug sont requis.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategory(category.id, { ...form, ...feePayload(fees) });
      } else {
        await createCategory({ ...form, ...feePayload(fees), parentId: parentCategory?.id });
      }
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible d\'enregistrer cette catégorie.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          {isEdit ? 'Modifier la catégorie' : parentCategory ? `Ajouter une sous-catégorie` : 'Ajouter une catégorie'}
        </h3>
        {parentCategory && !isEdit && (
          <p className="mt-1 text-sm text-gray-500">
            Sous-catégorie de <strong>{parentCategory.name}</strong>.
          </p>
        )}

        {isEdit && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {imageUrl ? (
              <img loading="lazy" decoding="async"
                src={imageUrl}
                alt={category.name}
                className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white text-gray-300">
                <IconImage className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Image de la catégorie</p>
              <p className="text-xs text-gray-500">Affichée sur la page d'accueil. JPG/PNG, 5 Mo max.</p>
              {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingImage ? 'Envoi...' : imageUrl ? "Changer l'image" : 'Ajouter une image'}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    disabled={uploadingImage}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {isEdit && (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {iconUrl ? (
              <img loading="lazy" decoding="async"
                src={iconUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border border-gray-200 bg-white object-contain p-2"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white text-gray-300">
                <IconImage className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Icône (SVG)</p>
              <p className="text-xs text-gray-500">
                Utilisée dans les menus/listes de catégories. Fichier .svg, 100 Ko max.
              </p>
              {iconError && <p className="mt-1 text-xs text-red-600">{iconError}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  disabled={uploadingIcon}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingIcon ? 'Envoi...' : iconUrl ? "Changer l'icône" : 'Ajouter une icône'}
                </button>
                {iconUrl && (
                  <button
                    type="button"
                    onClick={handleIconDelete}
                    disabled={uploadingIcon}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                ref={iconInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleIconUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Nom *</label>
            <input required name="name" value={form.name} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input required
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="ex: traiteur"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Icône</label>
              <input
                name="icon"
                value={form.icon}
                onChange={handleChange}
                placeholder="ex: cake"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ordre</label>
              <input
                type="number"
                name="sortOrder"
                value={form.sortOrder}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <CategoryFeeFields value={fees} onChange={setFees} />

          {!isEdit && (
            <p className="text-xs text-gray-500">
              L'image pourra être ajoutée après la création de la catégorie.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
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

export default CategoryForm;
