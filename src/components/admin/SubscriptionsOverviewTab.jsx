import { useEffect, useState } from 'react';
import { getAllProviders, updateProviderSubscription } from '../../services/adminService';
import PlanModal from './PlanModal';

const PLAN_LABELS = { starter: 'Starter', pro: 'Pro', premium: 'Premium', elite: 'Elite' };

const PLAN_COLORS = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  elite: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
};

function getSubscription(listing) {
  return listing.owner?.subscriptions?.[0] || null;
}

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function SubscriptionsOverviewTab() {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planModalListing, setPlanModalListing] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProviders({ q: q || undefined, plan: plan || undefined, page });
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les abonnements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, plan]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleConfirmPlanChange = async (payload) => {
    await updateProviderSubscription(planModalListing.id, payload);
    setPlanModalListing(null);
    await fetchListings();
  };

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un prestataire..."
          className={`${inputClass} min-w-[220px] flex-1`}
        />
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">Tous les plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="elite">Elite</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Rechercher
        </button>
        <span className="ml-auto self-center text-sm text-gray-500">
          {pagination.total} résultat(s)
        </span>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : listings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucun prestataire trouvé.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Prestataire</th>
                <th className="px-4 py-3">Gérant</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => {
                const subscription = getSubscription(listing);
                const listingPlan = subscription?.plan || 'starter';
                return (
                  <tr key={listing.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{listing.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {listing.owner?.firstName} {listing.owner?.lastName}
                      <div className="text-xs text-gray-400">{listing.owner?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_COLORS[listingPlan]}`}>
                        {PLAN_LABELS[listingPlan]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_COLORS[subscription?.status || 'active']
                        }`}
                      >
                        {subscription?.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {subscription ? `${Number(subscription.price).toFixed(3)} DT` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{subscription?.startDate || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{subscription?.endDate || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setPlanModalListing(listing)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-gray-500">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      {planModalListing && (
        <PlanModal
          listing={planModalListing}
          subscription={getSubscription(planModalListing)}
          onConfirm={handleConfirmPlanChange}
          onCancel={() => setPlanModalListing(null)}
        />
      )}
    </div>
  );
}

export default SubscriptionsOverviewTab;
