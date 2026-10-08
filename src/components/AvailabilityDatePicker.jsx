import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const VIEWPORT_MARGIN = 16;
import { getAvailability } from '../services/listingService';
import { IconCalendar, IconChevronLeft, IconChevronRight } from './icons';

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

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

// Meme grille lun->dim que CalendarTab (espace prestataire) - voir
// components/provider/CalendarTab.jsx pour l'original.
function buildMonthWeeks(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  const leadingOffset = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = leadingOffset; i > 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i + 1, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, inMonth: true, dateStr: toDateStr(year, monthIndex, d) });
  }
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

function formatDisplay(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Selecteur de date public (fiche prestataire, demande de devis "Maison
// d'hote") affichant les dates reellement indisponibles du prestataire
// (calendrier prestataire, voir availabilityController.getAvailability) -
// quadrillage identique a CalendarTab, mais en lecture seule et limite a un
// mois a la fois (popover compact). `minDate` bloque tout jour anterieur
// (ex. la date d'arrivee deja choisie, pour le champ Depart).
// `align` : bord du champ auquel le popover s'accroche - 'right' pour un
// champ en colonne de droite (ex. Depart), sinon il deborde du formulaire.
function AvailabilityDatePicker({
  listingId,
  label,
  value,
  onChange,
  minDate,
  placeholder = 'Sélectionner...',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  // Decalage horizontal applique au popover pour qu'il reste dans l'ecran :
  // l'ancrage gauche/droite (`align`) ne suffit pas sur les tres petits
  // ecrans (320px), ou le champ est plus etroit que le calendrier.
  const [shiftX, setShiftX] = useState(0);

  useLayoutEffect(() => {
    if (!open || !popoverRef.current) {
      setShiftX(0);
      return;
    }
    const rect = popoverRef.current.getBoundingClientRect();
    const naturalLeft = rect.left - shiftX;
    const naturalRight = rect.right - shiftX;
    const maxRight = window.innerWidth - VIEWPORT_MARGIN;
    if (naturalRight > maxRight) setShiftX(maxRight - naturalRight);
    else if (naturalLeft < VIEWPORT_MARGIN) setShiftX(VIEWPORT_MARGIN - naturalLeft);
    else setShiftX(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!listingId) return;
    getAvailability(listingId)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [listingId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const blockedDates = useMemo(
    () => new Set(entries.filter((e) => e.isAvailable === false).map((e) => e.date)),
    [entries]
  );

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const effectiveMinDate = minDate && minDate > todayStr ? minDate : todayStr;

  const isDisabled = (dateStr) => dateStr < effectiveMinDate || blockedDates.has(dateStr);

  const weeks = useMemo(() => buildMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    setViewMonth((prevMonth) => {
      let nextMonth = prevMonth + delta;
      let nextYear = viewYear;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      } else if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      setViewYear(nextYear);
      return nextMonth;
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
      >
        <IconCalendar className="h-4 w-4 shrink-0 text-green-700" />
        <span className={`min-w-0 truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{ transform: `translateX(${shiftX}px)` }}
          className={`absolute z-20 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Mois précédent"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Mois suivant"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
            {DAY_HEADERS.map((headerLabel) => (
              <span key={headerLabel} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {headerLabel}
              </span>
            ))}
            {weeks.map((week, wIdx) =>
              week.map((cell, dIdx) => {
                if (!cell.inMonth) {
                  return (
                    <span key={`${wIdx}-${dIdx}`} className="py-1 text-xs text-gray-200">
                      {cell.day}
                    </span>
                  );
                }
                const disabled = isDisabled(cell.dateStr);
                const blocked = blockedDates.has(cell.dateStr) && cell.dateStr >= todayStr;
                const selected = cell.dateStr === value;
                const isToday = cell.dateStr === todayStr;

                return (
                  <button
                    key={`${wIdx}-${dIdx}`}
                    type="button"
                    disabled={disabled}
                    title={blocked ? 'Non disponible' : undefined}
                    onClick={() => {
                      onChange(cell.dateStr);
                      setOpen(false);
                    }}
                    style={
                      blocked && !selected
                        ? {
                            backgroundImage:
                              'repeating-linear-gradient(45deg, #fecdd3 0, #fecdd3 3px, #fff1f2 3px, #fff1f2 7px)',
                          }
                        : undefined
                    }
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                      selected
                        ? 'bg-blue-700 text-white'
                        : disabled
                          ? 'cursor-not-allowed text-rose-400'
                          : 'text-gray-700 hover:bg-gray-100'
                    } ${isToday && !selected ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                  >
                    {cell.day}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #fecdd3 0, #fecdd3 2px, #fff1f2 2px, #fff1f2 4px)',
                }}
              />
              Indisponible
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-700" />
              Sélectionné
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailabilityDatePicker;
