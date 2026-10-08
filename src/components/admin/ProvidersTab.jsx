import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllProviders,
  updateProviderStatus,
  softDeleteProvider,
  resetProviderPassword,
  updateProviderSubscription,
  getProvidersStats,
} from '../../services/adminService';
import CreateProviderForm from './CreateProviderForm';
import EditProviderForm from './EditProviderForm';
import StatusReasonModal from './StatusReasonModal';
import ConfirmModal from './ConfirmModal';
import ResetPasswordModal from './ResetPasswordModal';
import PlanModal from './PlanModal';
import ProviderStatsModal from './ProviderStatsModal';
import { IconEdit, IconPause, IconPlay, IconTrash, IconCrown, IconChart, IconDownload, IconLock } from '../icons';

// Genere et telecharge un CSV cote client (donnees deja recuperees via
// GET /admin/providers/stats, pas d'endpoint d'export dedie cote serveur).
function downloadStatsCsv(rows) {
  const header = [
    'Fiche',
    'Ville',
    'Catégorie',
    'Statut',
    'Demandes',
    'Réservations',
    'Réservations via plateforme',
    'Réservations hors plateforme',
    'Taux de conversion',
  ];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  rows.forEach((row) => {
    lines.push(
      [
        row.title,
        row.city || '',
        row.category?.name || '',
        row.status,
        row.leadsTotal,
        row.bookingsTotal,
        row.bookingsByOrigin?.platform ?? '',
        row.bookingsByOrigin?.offPlatform ?? '',
        `${Math.round((row.conversionRate || 0) * 100)}%`,
      ]
        .map(escape)
        .join(',')
    );
  });

  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'prestataires-statistiques.csv';
  link.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS = {
  pending: 'En attente',
  active: 'Active',
  suspended: 'Suspendue',
  rejected: 'Rejetée',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-gray-200 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
};

const PLAN_LABELS = { starter: 'Starter', pro: 'Pro', premium: 'Premium', elite: 'Elite' };

const PLAN_COLORS = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  elite: 'bg-purple-100 text-purple-700',
};

function getListingPlan(listing) {
  return listing.owner?.subscriptions?.[0]?.plan || 'starter';
}

function getListingSubscription(listing) {
  return listing.owner?.subscriptions?.[0] || null;
}

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function ProvidersTab() {
  const { user } = useAuth();
  const adminRole = user?.adminRole;
  const canEdit = adminRole === 'super_admin';
  const canChangeStatus = adminRole === 'super_admin' || adminRole === 'moderator';
  const canDelete = adminRole === 'super_admin';

  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [statusModalListing, setStatusModalListing] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [resettingPasswordListing, setResettingPasswordListing] = useState(null);
  const [planModalListing, setPlanModalListing] = useState(null);
  const [statsListing, setStatsListing] = useState(null);

  // Compteurs demandes/reservations (M10) : recuperes separement de la liste
  // paginee principale (GET /admin/providers), puis fusionnes par listingId -
  // evite de dupliquer la logique de recherche/filtre/pagination existante.
  const [statsByListing, setStatsByListing] = useState(new Map());
  const [statsSort, setStatsSort] = useState(null); // null | 'leads' | 'bookings'

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProviders({ q: q || undefined, status: status || undefined, page });
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les prestataires.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getProvidersStats({ limit: 500 });
      setStatsByListing(new Map(data.results.map((row) => [row.listingId, row])));
    } catch {
      // Non bloquant : les colonnes Demandes/Reservations restent vides si
      // ca echoue, le reste de la table (donnees principales) reste utilisable.
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    fetchStats();
  }, []);

  const sortedListings =
    statsSort === null
      ? listings
      : [...listings].sort((a, b) => {
          const key = statsSort === 'bookings' ? 'bookingsTotal' : 'leadsTotal';
          const bStat = statsByListing.get(b.id)?.[key] || 0;
          const aStat = statsByListing.get(a.id)?.[key] || 0;
          return bStat - aStat;
        });

  const toggleStatsSort = (key) => setStatsSort((prev) => (prev === key ? null : key));

  const handleExportCsv = async () => {
    try {
      const data = await getProvidersStats({ limit: 1000 });
      downloadStatsCsv(data.results);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'exporter les statistiques.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleConfirmStatusChange = async (reason) => {
    const nextStatus = statusModalListing.status === 'suspended' ? 'active' : 'suspended';
    await updateProviderStatus(statusModalListing.id, { status: nextStatus, reason });
    setStatusModalListing(null);
    await fetchListings();
  };

  const handleConfirmDelete = async () => {
    await softDeleteProvider(deletingListing.id);
    setDeletingListing(null);
    await fetchListings();
  };

  const handleConfirmPlanChange = async (payload) => {
    await updateProviderSubscription(planModalListing.id, payload);
    setPlanModalListing(null);
    await fetchListings();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prestataires</h2>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total} prestataire(s) au total.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <IconDownload className="h-4 w-4" />
            Exporter CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            + Ajouter un prestataire
          </button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, entreprise, email)..."
          className={`${inputClass} min-w-[240px] flex-1`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="active">Active</option>
          <option value="suspended">Suspendue</option>
          <option value="rejected">Rejetée</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Rechercher
        </button>
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
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Gérant</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleStatsSort('leads')}
                    className={`flex items-center gap-1 ${statsSort === 'leads' ? 'text-rose-600' : ''}`}
                  >
                    Demandes {statsSort === 'leads' && '↓'}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleStatsSort('bookings')}
                    className={`flex items-center gap-1 ${statsSort === 'bookings' ? 'text-rose-600' : ''}`}
                  >
                    Réservations {statsSort === 'bookings' && '↓'}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{listing.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {listing.owner?.firstName} {listing.owner?.lastName}
                    <div className="text-xs text-gray-400">{listing.owner?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{listing.category?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{listing.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {listing.ratingCount > 0 ? `${listing.ratingAvg} ★ (${listing.ratingCount})` : 'Nouveau'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[listing.status]}`}
                    >
                      {STATUS_LABELS[listing.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_COLORS[getListingPlan(listing)]}`}
                    >
                      {PLAN_LABELS[getListingPlan(listing)]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#4E8BC4' }}>
                    {statsByListing.get(listing.id)?.leadsTotal ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium" style={{ color: '#4E8BC4' }}>
                      {statsByListing.get(listing.id)?.bookingsTotal ?? '—'}
                    </span>
                    {statsByListing.get(listing.id)?.bookingsByOrigin && (
                      <div className="text-xs" style={{ color: '#8A9BA8' }}>
                        {statsByListing.get(listing.id).bookingsByOrigin.platform} plateforme ·{' '}
                        {statsByListing.get(listing.id).bookingsByOrigin.offPlatform} hors
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStatsListing(listing)}
                        title="Statistiques"
                        aria-label="Statistiques"
                        className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                      >
                        <IconChart className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setPlanModalListing(listing)}
                          title="Attribuer un plan"
                          aria-label="Attribuer un plan"
                          className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100"
                        >
                          <IconCrown className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingListing(listing)}
                          title="Modifier"
                          aria-label="Modifier"
                          className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setResettingPasswordListing(listing)}
                          title="Réinitialiser le mot de passe"
                          aria-label="Réinitialiser le mot de passe"
                          className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                        >
                          <IconLock className="h-4 w-4" />
                        </button>
                      )}
                      {canChangeStatus && (listing.status === 'active' || listing.status === 'suspended') && (
                        <button
                          type="button"
                          onClick={() => setStatusModalListing(listing)}
                          title={listing.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                          aria-label={listing.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                          className={
                            listing.status === 'suspended'
                              ? 'rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200'
                              : 'rounded-lg bg-amber-100 p-2 text-amber-700 hover:bg-amber-200'
                          }
                        >
                          {listing.status === 'suspended' ? (
                            <IconPlay className="h-4 w-4" />
                          ) : (
                            <IconPause className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingListing(listing)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-600 hover:text-white"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      {showCreateForm && (
        <CreateProviderForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchListings();
          }}
        />
      )}

      {editingListing && (
        <EditProviderForm
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            setEditingListing(null);
            fetchListings();
          }}
        />
      )}

      {statusModalListing && (
        <StatusReasonModal
          title={statusModalListing.status === 'suspended' ? 'Réactiver la fiche' : 'Suspendre la fiche'}
          description={`"${statusModalListing.title}" — un email sera envoyé au prestataire.`}
          confirmLabel={statusModalListing.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
          showReason={statusModalListing.status !== 'suspended'}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => setStatusModalListing(null)}
        />
      )}

      {deletingListing && (
        <ConfirmModal
          title={`Supprimer "${deletingListing.title}" ?`}
          description="Cette action est réversible : la fiche sera déplacée dans l'onglet Supprimés."
          confirmLabel="Supprimer"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingListing(null)}
        />
      )}

      {resettingPasswordListing && (
        <ResetPasswordModal
          listing={resettingPasswordListing}
          onConfirm={() => resetProviderPassword(resettingPasswordListing.id)}
          onClose={() => setResettingPasswordListing(null)}
        />
      )}

      {planModalListing && (
        <PlanModal
          listing={planModalListing}
          subscription={getListingSubscription(planModalListing)}
          onConfirm={handleConfirmPlanChange}
          onCancel={() => setPlanModalListing(null)}
        />
      )}

      {statsListing && (
        <ProviderStatsModal listing={statsListing} onClose={() => setStatsListing(null)} />
      )}
    </div>
  );
}

export default ProvidersTab;
