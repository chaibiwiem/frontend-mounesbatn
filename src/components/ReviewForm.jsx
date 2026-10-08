import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createReview } from '../services/reviewService';
import UploadDropzone from './UploadDropzone';
import { IconStar, IconThumbUp, IconThumbDown, IconArrowLeft, IconX, IconMapPin, IconImage } from './icons';

const MAX_PHOTOS = 5;
const TITLE_MIN = 10;
const COMMENT_MIN = 75;

const CRITERIA = [
  { key: 'qualityRating', label: 'Qualité du service' },
  { key: 'responseTimeRating', label: 'Temps de réponse' },
  { key: 'professionalismRating', label: 'Professionnalisme' },
  { key: 'valueRating', label: 'Rapport qualité/prix' },
  { key: 'flexibilityRating', label: 'Flexibilité' },
];

function StarRatingInput({ label, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} étoiles - ${label}`}
          >
            <IconStar className={`h-6 w-6 ${star <= value ? 'fill-current text-amber-500' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProviderThumbnail({ listing, title, className }) {
  const image = listing?.images?.[0]?.url;
  return image ? (
    <img src={image} alt={title} className={className} />
  ) : (
    <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-300`}>
      <IconImage className="h-8 w-8" />
    </div>
  );
}

function ReviewForm({ bookingId, listing, onClose, onSuccess }) {
  const { user } = useAuth();
  const providerTitle = listing?.title;
  const providerCategory = listing?.category?.name;
  // Un avis lie a une reservation (bookingId fourni) est toujours redige par
  // le client connecte proprietaire de la reservation ; sinon (avis public),
  // un visiteur anonyme doit indiquer son nom.
  const needsGuestName = !bookingId && !user;

  const [step, setStep] = useState('recommend');
  const [recommend, setRecommend] = useState(null);
  const [ratings, setRatings] = useState({
    qualityRating: 0,
    responseTimeRating: 0,
    professionalismRating: 0,
    valueRating: 0,
    flexibilityRating: 0,
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allRated = CRITERIA.every((c) => ratings[c.key] > 0);
  const detailsValid =
    title.trim().length >= TITLE_MIN &&
    comment.trim().length >= COMMENT_MIN &&
    (!needsGuestName || guestName.trim().length >= 2);

  const handleAddPhotos = (files) => {
    if (photos.length + files.length > MAX_PHOTOS) {
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
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index) => setPhotos(photos.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await createReview({
        bookingId,
        listingId: listing?.id,
        guestName: needsGuestName ? guestName.trim() : undefined,
        recommend,
        ...ratings,
        title: title.trim(),
        comment: comment.trim(),
        photos,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer votre avis.");
    } finally {
      setSubmitting(false);
    }
  };

  // Étape d'entrée (recommandation) : plein écran, sans le panneau prestataire,
  // pour reproduire la landing "Oui/Non" avant d'ouvrir l'assistant en 3 étapes.
  if (step === 'recommend') {
    return (
      <div className="fixed inset-0 z-20 overflow-y-auto bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Fermer">
            <IconArrowLeft className="h-6 w-6" />
          </button>

          <div className="mt-16 flex flex-col items-center text-center">
            <ProviderThumbnail listing={listing} title={providerTitle} className="h-56 w-56 rounded-2xl object-cover" />
            <p className="mt-4 text-lg font-bold text-gray-900">{providerTitle}</p>
            {providerCategory && <p className="text-sm text-gray-500">{providerCategory}</p>}

            <h2 className="mt-8 text-2xl font-bold text-gray-900">Recommanderiez-vous ce prestataire&nbsp;?</h2>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setRecommend(true);
                  setStep('ratings');
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 px-8 py-4 transition hover:border-rose-400 hover:bg-rose-50"
              >
                <IconThumbUp className="h-6 w-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Oui</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecommend(false);
                  setStep('ratings');
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 px-8 py-4 transition hover:border-rose-400 hover:bg-rose-50"
              >
                <IconThumbDown className="h-6 w-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Non</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepIndex = { ratings: 1, details: 2, confirm: 3 }[step];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:flex-row">
        <div className="shrink-0 overflow-y-auto border-b border-gray-100 bg-gray-50 p-6 md:w-80 md:border-b-0 md:border-r">
          <h3 className="text-lg font-bold text-gray-900">Partagez votre expérience</h3>
          <p className="mt-1 text-sm text-gray-500">Votre avis aide les futurs clients à bien choisir.</p>
          <ProviderThumbnail
            listing={listing}
            title={providerTitle}
            className="mt-4 h-48 w-full rounded-2xl object-cover"
          />
          {listing?.city && (
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">{listing.city}</p>
          )}
          <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-gray-900">
            <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            {listing?.address || providerTitle}
          </p>
        </div>

        {/* Colonne du formulaire : en-tete et pied de page fixes, seul le
            contenu de l'etape defile - sinon les boutons Retour/Suivant
            deviennent inatteignables des que le contenu depasse la hauteur
            de l'ecran (photos jointes, textarea longue, etc.). */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Étape {stepIndex}/3</span>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
              <div
                className="h-1 rounded-full bg-rose-600 transition-all"
                style={{ width: `${(stepIndex / 3) * 100}%` }}
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Racontez votre expérience avec {providerTitle}
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {step === 'ratings' && (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                {CRITERIA.map((c) => (
                  <StarRatingInput
                    key={c.key}
                    label={c.label}
                    value={ratings[c.key]}
                    onChange={(v) => setRatings((r) => ({ ...r, [c.key]: v }))}
                  />
                ))}
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-5">
                {needsGuestName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Votre nom</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Prénom"
                      maxLength={100}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Donnez un titre à votre avis</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Écrivez le titre ici"
                    maxLength={150}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Vous avez introduit {title.length} caractères. Il en faut au moins {TITLE_MIN}.
                  </p>
                </div>

                <div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    placeholder="Racontez votre expérience pour aider les autres clients. Le prestataire s'est-il adapté à votre budget ? Qu'avez-vous pensé de la relation qualité/prix et de son professionnalisme ?"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Vous avez introduit {comment.length} caractères. Il en faut au moins {COMMENT_MIN}.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ajoutez des photos <span className="font-normal text-gray-400">(Optionnel)</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Partagez vos images du service, elles servent d'inspiration aux autres clients !
                  </p>
                  <div className="mt-2">
                    <UploadDropzone
                      icon={IconImage}
                      formatLabel="Formats acceptés : .JPG, .PNG — 5 Mo max, 5 photos max"
                      buttonLabel="Cliquez ici pour télécharger vos photos"
                      accept="image/jpeg,image/png"
                      multiple
                      disabled={photos.length >= MAX_PHOTOS}
                      onFiles={handleAddPhotos}
                    />
                  </div>
                  {photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {photos.map((file, i) => (
                        <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                            aria-label="Retirer la photo"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {recommend ? (
                      <IconThumbUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconThumbDown className="h-4 w-4 text-red-500" />
                    )}
                    {recommend ? 'Vous recommandez ce prestataire' : 'Vous ne recommandez pas ce prestataire'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {CRITERIA.map((c) => (
                      <span key={c.key}>
                        {c.label} : {ratings[c.key]}/5
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{comment}</p>
                  {photos.length > 0 && <p className="mt-2 text-xs text-gray-400">{photos.length} photo(s) jointe(s)</p>}
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => setStep(step === 'ratings' ? 'recommend' : step === 'details' ? 'ratings' : 'details')}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <IconArrowLeft className="h-4 w-4" />
              Retour
            </button>

            {step === 'confirm' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? 'Envoi...' : "Publier l'avis"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === 'ratings' ? 'details' : 'confirm')}
                disabled={step === 'ratings' ? !allRated : !detailsValid}
                className="flex items-center gap-1 rounded-lg bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewForm;
