import { formatDT } from '../../services/connectionFeeService';

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const percent = (rate) => (rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)} %`);

// Tableau de bord des frais de mise en relation (M13) : total du mois,
// evolution mensuelle, repartition par categorie et taux de confirmation par
// prestataire (demandes confirmees / demandes passees "converties").
function ConnectionFeeDashboard({ stats, year, onYearChange }) {
  if (!stats) return <p className="text-sm text-gray-500">Chargement...</p>;
  const maxMonth = Math.max(1, ...stats.byMonth.map((m) => m.total));
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total validé du mois en cours</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatDT(stats.monthTotal)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">En attente de validation</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Taux de confirmation global</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{percent(stats.confirmationRate)}</p>
          <p className="text-[11px] text-gray-400">Demandes confirmées / demandes converties</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">Frais validés par mois</p>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex h-40 items-end gap-2">
          {stats.byMonth.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1" title={`${formatDT(m.total)} · ${m.count} ligne(s)`}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-rose-400"
                  style={{ height: `${(m.total / maxMonth) * 100}%`, minHeight: m.total > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[10px] text-gray-500">{MONTHS[m.month - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="font-semibold text-gray-900">Répartition par catégorie ({year})</p>
          {stats.byCategory.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Aucun frais validé sur cette période.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {stats.byCategory.map((c) => (
                  <tr key={c.categoryId}>
                    <td className="py-2 text-gray-700">{c.name}</td>
                    <td className="py-2 text-right text-gray-500">{c.count} ligne(s)</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{formatDT(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="font-semibold text-gray-900">Taux de confirmation par prestataire</p>
          <p className="text-xs text-gray-500">Du plus faible au plus élevé : à suivre en priorité en haut de liste.</p>
          {stats.providers.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Aucune demande convertie dans les catégories concernées.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-1 font-medium">Prestataire</th>
                    <th className="py-1 text-right font-medium">Converties</th>
                    <th className="py-1 text-right font-medium">Confirmées</th>
                    <th className="py-1 text-right font-medium">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.providers.map((p) => (
                    <tr key={p.listingId}>
                      <td className="py-2 text-gray-700">{p.title}</td>
                      <td className="py-2 text-right text-gray-700">{p.convertedCount}</td>
                      <td className="py-2 text-right text-gray-700">{p.confirmedCount}</td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          p.confirmationRate !== null && p.confirmationRate < 0.5 ? 'text-rose-600' : 'text-gray-900'
                        }`}
                      >
                        {percent(p.confirmationRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectionFeeDashboard;
