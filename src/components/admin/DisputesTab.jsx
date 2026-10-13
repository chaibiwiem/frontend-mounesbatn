import { useEffect, useState } from 'react';
import {
  getDisputes,
  getDispute,
  updateDispute,
  suspendListing,
  deleteReportedReview,
} from '../../services/adminService';

const STATUS_LABELS = { open: 'Ouvert', in_review: 'En cours', resolved: 'Résolu', rejected: 'Rejeté' };
const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-600',
};
const TYPE_LABELS = {
  no_show: 'Absence prestataire',
  misleading: 'Fiche trompeuse',
  fake_review: 'Faux avis',
  other: 'Autre',
};

function DisputesTab() {
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const data = await getDisputes(params);
      setDisputes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les litiges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (dispute) => {
    try {
      const detail = await getDispute(dispute.id);
      setSelected(detail);
      setResolution(detail.resolution || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger ce litige.');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateDispute(selected.id, { status, resolution });
      await fetchDisputes();
      setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour ce litige.');
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendListing(selected.listing.id);
      await fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de suspendre cette fiche.');
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReportedReview(selected.review.id);
      setSelected(null);
      await fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de supprimer cet avis.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Litiges</h2>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="mt-4 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Tous les statuts</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : disputes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucun litige.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {disputes.map((dispute) => (
            <button
              key={dispute.id}
              type="button"
              onClick={() => openDetail(dispute)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-rose-200"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {TYPE_LABELS[dispute.type]} · {dispute.listing?.title || 'Fiche supprimée'}
                </p>
                <p className="text-sm text-gray-500">
                  Signalé par {dispute.reporter?.firstName} {dispute.reporter?.lastName}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[dispute.status]}`}>
                {STATUS_LABELS[dispute.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Détail du litige</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Type : </span>
                {TYPE_LABELS[selected.type]}
              </p>
              <p>
                <span className="font-medium">Fiche : </span>
                {selected.listing?.title || 'Fiche supprimée'}
              </p>
              {selected.description && (
                <p>
                  <span className="font-medium">Description : </span>
                  {selected.description}
                </p>
              )}
              {selected.review && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-medium">Avis signalé :</p>
                  <p className="text-amber-500">{'★'.repeat(selected.review.rating)}</p>
                  {selected.review.comment && <p>{selected.review.comment}</p>}
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Résolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('in_review')}
                className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
              >
                Marquer en cours
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('resolved')}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
              >
                Marquer résolu
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('rejected')}
                className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300"
              >
                Rejeter le litige
              </button>
              {selected.listing && (
                <button
                  type="button"
                  onClick={handleSuspend}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  Suspendre la fiche
                </button>
              )}
              {selected.review && (
                <button
                  type="button"
                  onClick={handleDeleteReview}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Supprimer l&apos;avis
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DisputesTab;
