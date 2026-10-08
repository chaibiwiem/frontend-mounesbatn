import { useEffect, useState } from 'react';
import { getProviderStats } from '../../services/adminService';
import { IconX } from '../icons';

const LEAD_STATUS_LABELS = {
  new: 'Nouveau',
  answered: 'Répondu',
  late: 'En retard',
  converted: 'Converti',
  lost: 'Perdu',
};

const BOOKING_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const BOOKING_ORIGIN_LABELS = {
  platform: 'Via plateforme (lead converti)',
  offPlatform: 'Hors plateforme (saisie manuelle)',
};

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function last30Days() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toISODate(from), to: toISODate(to) };
}

function last12Months() {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return { from: toISODate(from), to: toISODate(to) };
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPercent(ratio) {
  return `${Math.round((ratio || 0) * 100)}%`;
}

// Carte de synthese - charte Mounesba (fond blanc, radius 12px, bordure
// #E8EEF3, chiffre #4E8BC4, libelle #8A9BA8).
function StatCard({ label, value, tooltip }) {
  return (
    <div
      className="relative flex flex-col gap-1 bg-white p-4"
      style={{ borderRadius: '12px', border: '1px solid #E8EEF3' }}
      title={tooltip}
    >
      <span className="text-2xl font-bold" style={{ color: '#4E8BC4' }}>
        {value}
      </span>
      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#8A9BA8' }}>
        {label}
        {tooltip && (
          <span
            className="flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: '#E8EEF3', color: '#8A9BA8' }}
          >
            i
          </span>
        )}
      </span>
    </div>
  );
}

// Barre de repartition par statut - degrade #4E8BC4 -> #FF99BE (charte).
function StatusBars({ counts, labels, total }) {
  const entries = Object.entries(counts);
  return (
    <div className="space-y-2.5">
      {entries.map(([key, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs" style={{ color: '#8A9BA8' }}>
              <span>{labels[key] || key}</span>
              <span className="font-semibold" style={{ color: '#2C3E50' }}>
                {count} ({pct}%)
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#E8EEF3' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #4E8BC4, #FF99BE)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Onglet "Statistiques" de la fiche prestataire admin (M10) - vue en modale,
// coherente avec le pattern de modales existant du back-office. Distingue
// toujours visuellement les demandes (donnee fiable, generee par la
// plateforme) des reservations (donnee declarative, saisie par le
// prestataire) - jamais fusionnees en un seul chiffre.
function ProviderStatsModal({ listing, onClose }) {
  const [period, setPeriod] = useState('30d'); // '30d' | '12m' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeRange =
    period === '30d' ? last30Days() : period === '12m' ? last12Months() : { from: customFrom, to: customTo };

  useEffect(() => {
    if (period === 'custom' && (!customFrom || !customTo)) return;

    setLoading(true);
    setError('');
    getProviderStats(listing.id, { from: activeRange.from, to: activeRange.to })
      .then(setStats)
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, period, customFrom, customTo]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: '#E8EEF3' }}>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'Playfair Display, serif', color: '#2C3E50' }}
            >
              Statistiques de réservations
            </h2>
            <p className="text-sm" style={{ color: '#8A9BA8' }}>
              {listing.title}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {[
              { key: '30d', label: '30 derniers jours' },
              { key: '12m', label: '12 mois' },
              { key: 'custom', label: 'Personnalisé' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={
                  period === opt.key
                    ? { backgroundColor: '#4E8BC4', color: '#fff' }
                    : { backgroundColor: '#E8EEF3', color: '#8A9BA8' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium" style={{ color: '#8A9BA8' }}>
                  Du
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-1.5 text-sm"
                  style={{ borderColor: '#E8EEF3' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium" style={{ color: '#8A9BA8' }}>
                  Au
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-1.5 text-sm"
                  style={{ borderColor: '#E8EEF3' }}
                />
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="mt-6 text-sm" style={{ color: '#8A9BA8' }}>
              Chargement...
            </p>
          ) : stats ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Demandes reçues" value={stats.leadsTotal} />
                <StatCard
                  label="Réservations"
                  value={stats.bookingsTotal}
                  tooltip="Chiffre déclaratif, saisi par le prestataire. Il peut inclure des clients obtenus hors plateforme."
                />
                <StatCard label="Taux de conversion" value={formatPercent(stats.conversionRate)} />
                <StatCard label="Taux de réponse" value={formatPercent(stats.responseRate)} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                    Répartition des demandes
                  </h3>
                  <p className="mb-3 text-xs" style={{ color: '#8A9BA8' }}>
                    Donnée fiable — générée automatiquement par la plateforme.
                  </p>
                  <StatusBars counts={stats.leadsByStatus} labels={LEAD_STATUS_LABELS} total={stats.leadsTotal} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                    Répartition des réservations
                  </h3>
                  <p className="mb-3 text-xs" style={{ color: '#8A9BA8' }}>
                    Donnée déclarative — saisie manuellement par le prestataire.
                  </p>
                  <StatusBars
                    counts={stats.bookingsByStatus}
                    labels={BOOKING_STATUS_LABELS}
                    total={stats.bookingsTotal}
                  />
                </div>
              </div>

              {stats.bookingsByOrigin && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold" style={{ color: '#2C3E50' }}>
                    Origine des réservations
                  </h3>
                  <p className="mb-3 text-xs" style={{ color: '#8A9BA8' }}>
                    Distingue les réservations issues d'une demande de devis (fiable) de celles saisies
                    directement par le prestataire pour un client trouvé hors plateforme.
                  </p>
                  <StatusBars
                    counts={stats.bookingsByOrigin}
                    labels={BOOKING_ORIGIN_LABELS}
                    total={stats.bookingsTotal}
                  />
                </div>
              )}

              <div
                className="mt-6 grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2"
                style={{ borderColor: '#E8EEF3', color: '#8A9BA8' }}
              >
                <p>
                  Dernière demande : <span style={{ color: '#2C3E50' }}>{formatDate(stats.lastLeadAt)}</span>
                </p>
                <p>
                  Dernière réservation :{' '}
                  <span style={{ color: '#2C3E50' }}>{formatDate(stats.lastBookingAt)}</span>
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProviderStatsModal;
