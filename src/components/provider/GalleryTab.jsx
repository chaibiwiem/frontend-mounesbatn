import { useEffect, useState } from 'react';
import {
  getMyListing,
  uploadListingImage,
  deleteListingImage,
  setPrimaryListingImage,
  reorderListingImages,
} from '../../services/listingService';
import { getMySubscription } from '../../services/subscriptionService';
import VideosSection from './VideosSection';
import UploadDropzone from '../UploadDropzone';
import { IconImage, IconPlay, IconLock } from '../icons';
import { cheapestPlanAbove } from '../../utils/planFeatures';

const SUB_TABS = [
  { id: 'photos', label: 'Photos', icon: IconImage },
  { id: 'videos', label: 'Vidéos', icon: IconPlay },
];

// Limites selon le plan souscrit (Parametres admin > Plans & Tarifs) - null
// cote API = illimite (voir subscriptionController/planService). En attendant
// le chargement, aucune limite n'est affichee/appliquee pour eviter de bloquer
// l'upload a tort le temps de la requete.
const UNLIMITED_LIMITS = { label: '', maxPhotos: Infinity, maxVideos: Infinity, maxPromotions: Infinity };

function GalleryTab() {
  const [subTab, setSubTab] = useState('photos');
  const [images, setImages] = useState([]);
  const [limits, setLimits] = useState(UNLIMITED_LIMITS);
  const [planCatalog, setPlanCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchImages = async () => {
    setLoading(true);
    try {
      const listing = await getMyListing();
      setImages([...listing.images].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la galerie.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const subscription = await getMySubscription();
      const planLimits = subscription.plans[subscription.effectivePlan];
      setPlanCatalog(subscription.plans);
      setLimits({
        label: planLimits.label,
        maxPhotos: planLimits.maxPhotos === null ? Infinity : planLimits.maxPhotos,
        maxVideos: planLimits.maxVideos === null ? Infinity : planLimits.maxVideos,
        maxPromotions: planLimits.maxPromotions === null ? Infinity : planLimits.maxPromotions,
      });
    } catch {
      // Abonnement illisible (ex. fiche pas encore creee) : on n'affiche/n'applique
      // aucune limite cote client, le backend reste l'autorite finale.
    }
  };

  useEffect(() => {
    fetchImages();
    fetchLimits();
  }, []);

  const maxPhotos = limits.maxPhotos;

  const handleFilesUpload = async (files) => {
    const remainingSlots = maxPhotos - images.length;
    const filesToUpload = files.slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      setError(
        `Votre plan (${limits.label}) autorise au maximum ${maxPhotos} photos : seules les ${filesToUpload.length} premières ont été prises en compte.`
      );
    } else {
      setError('');
    }

    const invalid = filesToUpload.find(
      (file) => file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)
    );
    if (invalid) {
      setError('Chaque photo doit être en JPG/PNG et faire moins de 5 Mo.');
      return;
    }

    setUploading(true);
    try {
      for (const file of filesToUpload) {
        // eslint-disable-next-line no-await-in-loop
        await uploadListingImage(file);
      }
      await fetchImages();
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteListingImage(id);
      await fetchImages();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cette photo.');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimaryListingImage(id);
      await fetchImages();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de définir la photo principale.');
    }
  };

  const moveImage = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setImages(reordered);

    try {
      await reorderListingImages(reordered.map((img) => img.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de réordonner la galerie.');
      await fetchImages();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Ma galerie</h2>

      <div className="mt-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          const locked =
            (tab.id === 'videos' && limits.maxVideos === 0) || (tab.id === 'photos' && limits.maxPhotos === 0);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              title={locked ? 'Non inclus dans votre plan' : undefined}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active
                  ? `bg-white shadow-sm ${locked ? 'text-gray-500' : 'text-rose-600'}`
                  : locked
                    ? 'text-gray-400 hover:text-gray-500'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {locked && <IconLock className="h-3.5 w-3.5" />}
            </button>
          );
        })}
      </div>

      {subTab === 'videos' ? (
        <div className="mt-4">
          <VideosSection
            maxVideos={limits.maxVideos}
            planLabel={limits.label}
            requiredPlan={cheapestPlanAbove(planCatalog, 'maxVideos', 0)}
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-900">Ajouter des photos</h3>
            {limits.label && (
              <p className="mt-1 text-xs text-gray-500">
                Plan {limits.label} : {images.length} /{' '}
                {Number.isFinite(maxPhotos) ? maxPhotos : 'illimité'} photos utilisées.
              </p>
            )}
            <div className="mt-2">
              <UploadDropzone
                icon={IconImage}
                formatLabel={`Format JPG ou PNG · 5 Mo maximum par fichier · jusqu'à ${
                  Number.isFinite(maxPhotos) ? maxPhotos : 'illimité'
                } photos`}
                buttonLabel="Ajouter des photos"
                accept="image/jpeg,image/png"
                multiple
                disabled={images.length >= maxPhotos}
                uploading={uploading}
                onFiles={handleFilesUpload}
              />
            </div>
            {images.length >= maxPhotos && (
              <p className="mt-2 text-xs text-gray-500">
                Limite de {maxPhotos} photos atteinte pour le plan {limits.label}. Passez à un plan
                supérieur pour en ajouter davantage.
              </p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="relative aspect-square bg-gray-100">
                    <img loading="lazy" decoding="async" src={image.url} alt="" className="h-full w-full object-cover" />
                    {image.isPrimary && (
                      <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Principale
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 p-2 text-xs">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      aria-label="Déplacer vers la gauche"
                    >
                      ←
                    </button>
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Définir principale
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      aria-label="Déplacer vers la droite"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GalleryTab;
