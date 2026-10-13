import { useCallback, useEffect, useState } from 'react';
import { getCategoriesAdmin } from '../../services/adminService';
import { getConnectionFeeStats } from '../../services/connectionFeeService';
import ConnectionFeeQueue from './ConnectionFeeQueue';
import ConnectionFeeInvoices from './ConnectionFeeInvoices';
import ConnectionFeeDashboard from './ConnectionFeeDashboard';
import ConnectionFeeCategories from './ConnectionFeeCategories';
import { IconInbox, IconFileText, IconChart, IconTag } from '../icons';

const SUB_TABS = [
  { id: 'queue', label: "File d'attente", icon: IconInbox },
  { id: 'invoices', label: 'Factures', icon: IconFileText },
  { id: 'dashboard', label: 'Tableau de bord', icon: IconChart },
  { id: 'categories', label: 'Catégories concernées', icon: IconTag },
];

// Section admin "Frais de mise en relation" (MODULES.md M13).
function ConnectionFeesAdminTab() {
  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [tree, setTree] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);

  const loadTree = useCallback(() => {
    getCategoriesAdmin()
      .then(setTree)
      .catch(() => setTree([]));
  }, []);
  const loadStats = useCallback(() => {
    getConnectionFeeStats({ year })
      .then(setStats)
      .catch(() => setStats(null));
  }, [year]);

  useEffect(loadTree, [loadTree]);
  useEffect(loadStats, [loadStats]);

  const flatCategories = tree.flatMap((parent) => [parent, ...(parent.children || [])]);
  const providers = stats?.providers || [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Frais de mise en relation</h2>
      <p className="mt-1 text-sm text-gray-500">
        Forfait fixe ou pourcentage du contrat déclaré, par demande aboutie dans les catégories concernées, après double confirmation (prestataire puis
        Mounesba). Aucun paiement en ligne : facture mensuelle réglée hors plateforme.
      </p>

      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'queue' && stats?.pendingCount > 0 && (
                <span className="rounded-full bg-rose-600 px-2 text-xs text-white">{stats.pendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeSubTab === 'queue' && <ConnectionFeeQueue categories={flatCategories} providers={providers} />}
        {activeSubTab === 'invoices' && <ConnectionFeeInvoices providers={providers} onChange={loadStats} />}
        {activeSubTab === 'dashboard' && <ConnectionFeeDashboard stats={stats} year={year} onYearChange={setYear} />}
        {activeSubTab === 'categories' && <ConnectionFeeCategories tree={tree} onChange={loadTree} />}
      </div>
    </div>
  );
}

export default ConnectionFeesAdminTab;
