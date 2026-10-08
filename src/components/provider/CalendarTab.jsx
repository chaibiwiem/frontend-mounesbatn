import { useEffect, useMemo, useState } from 'react';
import { getAvailability, upsertAvailability, deleteAvailability } from '../../services/listingService';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconChevronDown } from '../icons';

const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

// Grille lun->dim d'un mois donne, avec les jours de bourrage des mois
// adjacents (grises, non cliquables) pour completer les semaines.
function buildMonthWeeks(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  // getDay(): 0=dimanche -> on veut l'offset lundi=0
  const leadingOffset = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = leadingOffset; i > 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i + 1, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, inMonth: true, dateStr: toDateStr(year, monthIndex, d) });
  }
  // Toujours 6 semaines (42 cellules) : evite que les mois plus courts
  // s'etirent dans la grille CSS et laissent un vide avant la bordure.
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ day: trailing, inMonth: false });
    trailing += 1;
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function MonthCard({ year, monthIndex, availabilityMap, onToggleDay }) {
  const weeks = useMemo(() => buildMonthWeeks(year, monthIndex), [year, monthIndex]);
  const todayStr = useMemo(() => {
    const now = new Date();
    return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-center font-semibold text-gray-900">
        {MONTH_NAMES[monthIndex]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {DAY_HEADERS.map((label) => (
          <span key={label} className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </span>
        ))}
        {weeks.map((week, wIdx) =>
          week.map((cell, dIdx) => {
            if (!cell.inMonth) {
              return (
                <span key={`${wIdx}-${dIdx}`} className="py-1.5 text-xs text-gray-300">
                  {cell.day}
                </span>
              );
            }
            const entry = availabilityMap[cell.dateStr];
            const isBooked = entry?.source === 'booking';
            const isBlocked = entry?.isAvailable === false;
            const isToday = cell.dateStr === todayStr;

            if (isBooked) {
              const vehicleLabel = entry.vehicle
                ? [entry.vehicle.brand, entry.vehicle.model].filter(Boolean).join(' ')
                : null;
              return (
                <span
                  key={`${wIdx}-${dIdx}`}
                  title={vehicleLabel ? `Réservé - ${vehicleLabel}` : 'Réservé - demande de devis confirmée'}
                  className={`mx-auto flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white ${
                    isToday ? 'ring-2 ring-offset-2 ring-rose-500' : ''
                  }`}
                >
                  {cell.day}
                </span>
              );
            }

            return (
              <button
                key={`${wIdx}-${dIdx}`}
                type="button"
                onClick={() => onToggleDay(cell.dateStr, isBlocked)}
                title={isBlocked ? 'Non disponible - cliquer pour réinitialiser' : 'Disponible - cliquer pour bloquer'}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isBlocked
                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                } ${isToday ? 'ring-2 ring-offset-2 ring-rose-500' : ''}`}
              >
                {cell.day}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function CalendarTab({ listingId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearWindowStart, setYearWindowStart] = useState(new Date().getFullYear() - 1);

  const [form, setForm] = useState({ date: '', isAvailable: false, priceOverride: '' });
  const [saving, setSaving] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await getAvailability(listingId);
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le calendrier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availabilityMap = useMemo(() => {
    const map = {};
    entries.forEach((entry) => {
      map[entry.date] = entry;
    });
    return map;
  }, [entries]);

  const handleToggleDay = async (dateStr, isCurrentlyBlocked) => {
    setError('');
    try {
      if (isCurrentlyBlocked) {
        const existing = entries.find((e) => e.date === dateStr && e.source !== 'booking');
        if (existing) await deleteAvailability(existing.id);
      } else {
        await upsertAvailability({ date: dateStr, isAvailable: false });
      }
      await fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cette date.');
    }
  };

  const handlePriceFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePriceFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) {
      setError('Une date est requise.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await upsertAvailability({
        date: form.date,
        isAvailable: form.isAvailable,
        priceOverride: form.priceOverride || null,
      });
      setForm({ date: '', isAvailable: false, priceOverride: '' });
      await fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de sauvegarder cette date.');
    } finally {
      setSaving(false);
    }
  };

  const priceOverrideEntries = entries.filter((e) => e.priceOverride && e.source !== 'booking');

  const years = [yearWindowStart, yearWindowStart + 1, yearWindowStart + 2];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Votre calendrier</h2>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <IconCalendar className="h-5 w-5 text-gray-700" />
        </span>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Quand êtes-vous disponible ? </span>
          Aidez les couples en leur donnant cette information cruciale. Indiquez les jours de non
          disponibilité pour les guider.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full border border-gray-300 bg-white" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-100" />
            Non disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-500" />
            Réservé
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setYearWindowStart((y) => y - 1)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Années précédentes"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                y === year ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {y}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setYearWindowStart((y) => y + 1)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Années suivantes"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MONTH_NAMES.map((_, monthIndex) => (
            <MonthCard
              key={monthIndex}
              year={year}
              monthIndex={monthIndex}
              availabilityMap={availabilityMap}
              onToggleDay={handleToggleDay}
            />
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowPriceForm((v) => !v)}
          aria-expanded={showPriceForm}
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
        >
          Définir un tarif spécifique pour une date
          <IconChevronDown
            className={`h-4 w-4 transition-transform ${showPriceForm ? 'rotate-180' : ''}`}
          />
        </button>

        {showPriceForm && (
          <>
            <form
              onSubmit={handlePriceFormSubmit}
              className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input required
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handlePriceFormChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tarif spécifique (DT)</label>
                <input
                  type="number"
                  name="priceOverride"
                  value={form.priceOverride}
                  onChange={handlePriceFormChange}
                  className={inputClass}
                />
              </div>
              <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={form.isAvailable}
                  onChange={handlePriceFormChange}
                />
                Disponible
              </label>
              <button
                type="submit"
                disabled={saving}
                className="mb-0.5 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>

            {priceOverrideEntries.length > 0 && (
              <div className="mt-3 space-y-2">
                {priceOverrideEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm shadow-sm"
                  >
                    <span className="font-medium text-gray-900">{entry.date}</span>
                    <span className="text-gray-600">{entry.priceOverride} DT</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(entry.date, entry.isAvailable === false)}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      Réinitialiser
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CalendarTab;
