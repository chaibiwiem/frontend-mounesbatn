import { useEffect, useState } from 'react';
import {
  getMyListing,
  addListingVideoLink,
  uploadListingVideoFile,
  updateListingVideo,
  deleteListingVideo,
} from '../../services/listingService';
import UploadDropzone from '../UploadDropzone';
import VideoThumbnailCard from '../VideoThumbnailCard';
import VideoPlayerModal from '../VideoPlayerModal';
import { IconPlay } from '../icons';
import PlanLockedNotice from './PlanLockedNotice';
import { withHttps } from '../../utils/safeUrl';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// maxVideos/planLabel viennent du plan souscrit (GalleryTab -> getMySubscription),
// Infinity par defaut le temps du chargement pour ne pas bloquer a tort.
function VideosSection({ maxVideos = Infinity, planLabel = '', requiredPlan = null }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const listing = await getMyListing();
      setVideos([...(listing.videos || [])].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les vidéos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    setSubmittingLink(true);
    setError('');
    try {
      await addListingVideoLink(linkUrl.trim(), linkTitle.trim() || undefined, thumbnailFile);
      setLinkUrl('');
      setLinkTitle('');
      setThumbnailFile(null);
      await fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter ce lien vidéo.");
    } finally {
      setSubmittingLink(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
      setError('La vignette doit être en JPG/PNG et faire moins de 5 Mo.');
      return;
    }
    setError('');
    setThumbnailFile(file);
  };

  const handleFilesUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE) {
      setError('Fichier trop volumineux (max 50 Mo).');
      return;
    }
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setError('Format non supporté. Utilisez MP4 ou WebM.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      await uploadListingVideoFile(file, undefined, thumbnailFile);
      setThumbnailFile(null);
      await fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteListingVideo(id);
      await fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cette vidéo.');
    }
  };

  const handleEditThumbnail = async (id, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
      setError('La vignette doit être en JPG/PNG et faire moins de 5 Mo.');
      return;
    }

    try {
      await updateListingVideo(id, { thumbnailFile: file });
      await fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour la vignette.');
    }
  };

  const limitReached = videos.length >= maxVideos;
  const maxVideosLabel = Number.isFinite(maxVideos) ? maxVideos : 'illimité';

  // Plan sans video (maxVideos = 0) : l'option reste visible mais verrouillee
  // (encart explicatif) au lieu d'un formulaire inutilisable "0 / 0" - les
  // videos deja ajoutees (ex. avant une retrogradation) restent listees.
  if (maxVideos === 0) {
    return (
      <div>
        <PlanLockedNotice feature="Vidéos" currentPlan={planLabel} requiredPlan={requiredPlan} />
        {videos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {videos.map((video) => (
              <div key={video.id}>
                <VideoThumbnailCard video={video} onPlay={setPlayingVideo} />
                <div className="mt-1.5 text-right text-xs">
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        {planLabel && `Plan ${planLabel} : ${videos.length} / ${maxVideosLabel} vidéos utilisées. `}
        Jusqu&apos;à {maxVideosLabel} vidéos : lien YouTube/Vimeo ou fichier MP4/WebM (50 Mo max).
      </p>

      <form onSubmit={handleAddLink} className="mt-4 flex flex-wrap gap-2">
        <input
          type="url"
          inputMode="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onBlur={(e) => setLinkUrl(withHttps(e.target.value))}
          placeholder="Lien YouTube ou Vimeo..."
          disabled={limitReached}
          className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
        />
        <input
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          placeholder="Titre (optionnel)"
          disabled={limitReached}
          className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submittingLink || limitReached}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {submittingLink ? 'Ajout...' : '+ Ajouter le lien'}
        </button>
      </form>

      <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
        <span className="text-sm text-gray-600">Vignette personnalisée (optionnel)</span>
        {thumbnailFile ? (
          <>
            <img loading="lazy" decoding="async"
              src={URL.createObjectURL(thumbnailFile)}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
            <span className="truncate text-xs text-gray-500">{thumbnailFile.name}</span>
            <button
              type="button"
              onClick={() => setThumbnailFile(null)}
              className="ml-auto text-xs font-medium text-red-600 hover:underline"
            >
              Retirer
            </button>
          </>
        ) : (
          <label className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline">
            Choisir une image
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        S&apos;applique à la prochaine vidéo ajoutée (lien ou fichier) ci-dessous.
      </p>

      <div className="mt-4">
        <UploadDropzone
          icon={IconPlay}
          formatLabel={`Format MP4 ou WebM · 50 Mo maximum · jusqu'à ${maxVideosLabel} vidéos`}
          buttonLabel="Ajouter une vidéo"
          accept="video/mp4,video/webm"
          disabled={limitReached}
          uploading={uploading}
          onFiles={handleFilesUpload}
        />
        {limitReached && (
          <p className="mt-2 text-xs text-gray-500">
            Limite de {maxVideosLabel} vidéos atteinte{planLabel && ` pour le plan ${planLabel}`}. Passez à
            un plan supérieur pour en ajouter davantage.
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : videos.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">Aucune vidéo pour le moment.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id}>
              <VideoThumbnailCard video={video} onPlay={setPlayingVideo} />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <label className="cursor-pointer font-medium text-rose-600 hover:underline">
                  {video.thumbnailUrl ? 'Changer la vignette' : '+ Ajouter une vignette'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleEditThumbnail(video.id, e)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleDelete(video.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {playingVideo && (
        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}

export default VideosSection;
