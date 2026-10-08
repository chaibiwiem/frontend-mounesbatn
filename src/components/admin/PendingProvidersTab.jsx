import { useEffect, useState } from 'react';
import { getPendingProviders, reviewProvider } from '../../services/adminService';
import CreateProviderForm from './CreateProviderForm';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function PendingProvidersTab() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectDrafts, setRejectDrafts] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await getPendingProviders();
      setListings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la file de validation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleApprove = async (listing) => {
    try {
      await reviewProvider(listing.id, { decision: 'approve' });
      await fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'approuver cette fiche.");
    }
  };

  const handleReject = async (listing) => {
    const reason = rejectDrafts[listing.id];
    if (!reason?.trim()) {
      setError('Un motif est requis pour rejeter une fiche.');
      return;
    }
    try {
      await reviewProvider(listing.id, { decision: 'reject', reason });
      await fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de rejeter cette fiche.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prestataires en attente de validation</h2>
          <p className="mt-1 text-sm text-gray-500">Délai de traitement cible : 72h.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          + Ajouter un prestataire
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : listings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucune fiche en attente.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {listing.category?.name} · {listing.city}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {listing.owner?.firstName} {listing.owner?.lastName} · {listing.owner?.email}
                    {listing.owner?.phone && ` · ${listing.owner.phone}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(listing)}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Approuver
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={rejectDrafts[listing.id] || ''}
                  onChange={(e) =>
                    setRejectDrafts((prev) => ({ ...prev, [listing.id]: e.target.value }))
                  }
                  placeholder="Motif de rejet..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => handleReject(listing)}
                  className="whitespace-nowrap rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateProviderForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchListings();
          }}
        />
      )}
    </div>
  );
}

export default PendingProvidersTab;
