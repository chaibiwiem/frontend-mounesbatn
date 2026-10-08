import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/adminService';
import {
  IconBuilding,
  IconUsers,
  IconClipboardCheck,
  IconInbox,
  IconChart,
  IconReceipt,
} from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

const ACCENTS = {
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  gray: 'bg-gray-100 text-gray-600',
};

function StatCard({ label, value, icon: Icon, accent = 'rose' }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardStatsTab() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (period.startDate) params.startDate = period.startDate;
      if (period.endDate) params.endDate = period.endDate;
      const data = await getDashboardStats(params);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Tableau de bord global</h2>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Depuis</label>
          <input
            type="date"
            value={period.startDate}
            onChange={(e) => setPeriod((prev) => ({ ...prev, startDate: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Jusqu&apos;à</label>
          <input
            type="date"
            value={period.endDate}
            onChange={(e) => setPeriod((prev) => ({ ...prev, endDate: e.target.value }))}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Filtrer
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : (
        stats && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Prestataires inscrits" value={stats.providersCount} icon={IconBuilding} accent="rose" />
            <StatCard label="Clients inscrits" value={stats.clientsCount} icon={IconUsers} accent="blue" />
            <StatCard
              label="Fiches actives"
              value={stats.activeListingsCount}
              icon={IconClipboardCheck}
              accent="green"
            />
            <StatCard
              label="Fiches en attente"
              value={stats.pendingListingsCount}
              icon={IconClipboardCheck}
              accent="amber"
            />
            <StatCard label="Demandes de devis (période)" value={stats.leadsCount} icon={IconInbox} accent="blue" />
            <StatCard
              label="Abonnements actifs"
              value={stats.activeSubscriptionsCount}
              icon={IconChart}
              accent="gray"
            />
            <StatCard
              label="Revenus abonnements"
              value={`${stats.subscriptionRevenue} DT`}
              icon={IconReceipt}
              accent="green"
            />
          </div>
        )
      )}
    </div>
  );
}

export default DashboardStatsTab;
