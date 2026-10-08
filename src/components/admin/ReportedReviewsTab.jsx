import { useEffect, useState } from 'react';
import { getReportedReviews, dismissReviewReport, deleteReportedReview } from '../../services/adminService';

function ReportedReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getReportedReviews();
      setReviews(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les avis signalés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDismiss = async (review) => {
    try {
      await dismissReviewReport(review.id);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de conserver cet avis.');
    }
  };

  const handleDelete = async (review) => {
    try {
      await deleteReportedReview(review.id);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cet avis.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Avis signalés</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucun avis signalé.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {review.author
                    ? `${review.author.firstName} ${review.author.lastName}`
                    : review.guestName || 'Client'}{' '}
                  · {review.listing?.title}
                </p>
                <span className="text-amber-500">{'★'.repeat(review.rating)}</span>
              </div>
              {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}

              {review.photos?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {review.photos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDismiss(review)}
                  className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Conserver (lever le signalement)
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(review)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Supprimer l&apos;avis
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportedReviewsTab;
