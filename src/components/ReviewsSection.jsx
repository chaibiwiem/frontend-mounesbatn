import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ReviewForm from './ReviewForm';
import { IconStar, IconChevronLeft, IconChevronRight, IconImage } from './icons';

const COMMENT_PREVIEW_LENGTH = 140;

function ratingLabel(avg) {
  if (avg >= 4.5) return 'Excellent';
  if (avg >= 4) return 'Très bien';
  if (avg >= 3) return 'Bien';
  if (avg >= 2) return 'Moyen';
  return 'À améliorer';
}

function ReviewPhotoMosaic({ photos }) {
  // Un fichier peut manquer sur le serveur (upload perdu, nettoyage manuel...) :
  // on retire silencieusement les photos cassees plutot que d'afficher l'icone
  // de rupture du navigateur, qui casserait toute la mise en page de la mosaique.
  const [brokenIds, setBrokenIds] = useState(() => new Set());
  const workingPhotos = photos.filter((photo) => !brokenIds.has(photo.id));

  const markBroken = (id) => {
    setBrokenIds((prev) => new Set(prev).add(id));
  };

  if (workingPhotos.length === 0) return null;

  if (workingPhotos.length < 4) {
    return (
      <div className="mt-4 flex gap-2">
        {workingPhotos.slice(0, 4).map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            onError={() => markBroken(photo.id)}
            className="h-28 w-28 rounded-xl object-cover"
          />
        ))}
      </div>
    );
  }

  const remaining = workingPhotos.length - 4;

  return (
    <div className="mt-4 grid h-56 grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
      <img
        src={workingPhotos[0].url}
        alt=""
        onError={() => markBroken(workingPhotos[0].id)}
        className="col-span-1 row-span-2 h-full w-full object-cover"
      />
      <img
        src={workingPhotos[1].url}
        alt=""
        onError={() => markBroken(workingPhotos[1].id)}
        className="col-start-2 h-full w-full object-cover"
      />
      <img
        src={workingPhotos[2].url}
        alt=""
        onError={() => markBroken(workingPhotos[2].id)}
        className="col-start-3 h-full w-full object-cover"
      />
      <div className="relative col-start-2 col-span-2 row-start-2">
        <img
          src={workingPhotos[3].url}
          alt=""
          onError={() => markBroken(workingPhotos[3].id)}
          className="h-full w-full object-cover"
        />
        {remaining > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-center text-sm font-semibold text-white">
            +{remaining} Photos utilisateurs
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, expanded, onToggleExpand }) {
  const comment = review.comment || '';
  const isLong = comment.length > COMMENT_PREVIEW_LENGTH;
  const displayedComment = expanded || !isLong ? comment : `${comment.slice(0, COMMENT_PREVIEW_LENGTH)}…`;
  const authorName = review.author?.firstName || review.guestName || 'Client';
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <div className="w-72 shrink-0 snap-start rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
          {initial}
        </span>
        <div>
          <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            {authorName}
          </p>
          {review.createdAt && (
            <p className="text-xs text-gray-400">
              Envoyé le {new Date(review.createdAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <IconStar key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
        ))}
        <span className="ml-1 text-xs font-semibold text-gray-700">{Number(review.rating).toFixed(1)}</span>
      </div>

      {review.title && <p className="mt-2 font-semibold text-gray-900">{review.title}</p>}
      {comment && (
        <p className="mt-1 text-sm text-gray-600">
          {displayedComment}
          {isLong && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="ml-1 font-medium text-rose-600 hover:underline"
            >
              {expanded ? 'Voir moins' : 'En savoir plus'}
            </button>
          )}
        </p>
      )}

      {review.providerReply && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
          <span className="font-medium">Réponse du prestataire : </span>
          {review.providerReply}
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ listing, onReviewSubmitted }) {
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);

  const reviews = listing.reviews || [];
  const reviewPhotos = reviews.flatMap((r) => r.photos || []);
  const recommendCount = reviews.filter((r) => r.recommend).length;
  const recommendPercent = reviews.length > 0 ? Math.round((recommendCount / reviews.length) * 100) : null;

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollByCard = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  // Avis public ouvert aux visiteurs anonymes et aux clients, sans exiger de
  // reservation (decision produit) : seuls les prestataires/admins, en
  // conflit d'interet sur leur propre marche, ne peuvent pas en publier.
  const handleWriteReviewClick = () => {
    if (user && user.role !== 'client') {
      setShowBlockedMessage(true);
      return;
    }
    setShowBlockedMessage(false);
    setShowReviewForm(true);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-gray-900">Avis de {listing.title}</h2>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          {listing.ratingCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <IconStar className="h-5 w-5 fill-current text-amber-500" />
                <span className="text-xl font-bold text-gray-900">{Number(listing.ratingAvg).toFixed(1)}</span>
                <span className="font-semibold text-gray-700">{ratingLabel(Number(listing.ratingAvg))}</span>
                <span className="text-sm text-gray-400">· {listing.ratingCount} avis</span>
              </div>
              {recommendPercent != null && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recommandé par {recommendPercent}% des clients
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Soyez le premier à donner votre avis sur ce prestataire.</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleWriteReviewClick}
            className="whitespace-nowrap rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Écrivez une recommandation
          </button>
          {showBlockedMessage && (
            <p className="max-w-[220px] text-right text-xs text-gray-500">
              Seuls les clients peuvent laisser un avis sur un prestataire.
            </p>
          )}
        </div>
      </div>

      <ReviewPhotoMosaic photos={reviewPhotos} />

      {reviews.length > 0 ? (
        <div className="relative mt-6">
          <div
            ref={scrollRef}
            className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                expanded={expandedIds.has(review.id)}
                onToggleExpand={() => toggleExpand(review.id)}
              />
            ))}
          </div>

          {reviews.length > 3 && (
            <>
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Avis précédents"
                className="absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-gray-600 shadow ring-1 ring-gray-200 hover:bg-gray-50 sm:flex"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Avis suivants"
                className="absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-1.5 text-gray-600 shadow ring-1 ring-gray-200 hover:bg-gray-50 sm:flex"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <IconImage className="h-5 w-5 text-gray-300" />
          Aucun avis pour le moment.
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          listing={listing}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            onReviewSubmitted?.();
          }}
        />
      )}
    </div>
  );
}

export default ReviewsSection;
