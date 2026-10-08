import { useEffect, useState } from 'react';
import { getMyListing } from '../../services/listingService';
import { replyToReview, reportReview, verifyReview } from '../../services/reviewService';
import { IconThumbUp, IconThumbDown } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const listing = await getMyListing();
      setReviews(listing.reviews || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (review) => {
    const reply = replyDrafts[review.id];
    if (!reply?.trim()) return;
    try {
      await replyToReview(review.id, reply);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de répondre à cet avis.');
    }
  };

  const handleReport = async (review) => {
    try {
      await reportReview(review.id, { type: 'fake_review' });
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de signaler cet avis.');
    }
  };

  const handleVerify = async (review) => {
    setVerifyingId(review.id);
    try {
      await verifyReview(review.id);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de confirmer cet avis.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Avis reçus</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucun avis pour le moment.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-gray-900">
                  {review.author?.firstName || review.guestName || 'Client'}
                  {review.isVerified ? (
                    <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                      Vérifié
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Avis public
                    </span>
                  )}
                </span>
                <span className="text-amber-500">{'★'.repeat(review.rating)}</span>
              </div>

              {!review.isVerified && (
                <button
                  type="button"
                  onClick={() => handleVerify(review)}
                  disabled={verifyingId === review.id}
                  className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {verifyingId === review.id ? 'Confirmation...' : 'Vérifier et confirmer cet avis'}
                </button>
              )}
              {review.title && <p className="mt-1 font-semibold text-gray-900">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
              {review.recommend != null && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
                    review.recommend ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {review.recommend ? <IconThumbUp className="h-3.5 w-3.5" /> : <IconThumbDown className="h-3.5 w-3.5" />}
                  {review.recommend ? 'Recommande ce prestataire' : 'Ne recommande pas ce prestataire'}
                </span>
              )}

              {review.photos?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {review.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              {review.isReported && (
                <span className="mt-2 inline-block text-xs font-medium text-amber-600">
                  Signalé — en attente de modération
                </span>
              )}

              {review.providerReply ? (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <span className="font-medium">Votre réponse : </span>
                  {review.providerReply}
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyDrafts[review.id] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                    placeholder="Répondre à cet avis..."
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(review)}
                    className="whitespace-nowrap rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Répondre
                  </button>
                </div>
              )}

              {!review.isReported && (
                <button
                  type="button"
                  onClick={() => handleReport(review)}
                  className="mt-2 text-xs text-gray-500 hover:text-red-600"
                >
                  Signaler cet avis
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsTab;
