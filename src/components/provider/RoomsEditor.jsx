import { IconPlus, IconTrash } from '../icons';
import { DEFAULT_ROOM } from '../../utils/stay';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-center text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

const FIELDS = [
  { field: 'adults', label: 'Adultes', hint: '12 ans et +', min: 1 },
  { field: 'children', label: 'Enfants', hint: '2-11 ans', min: 0 },
  { field: 'babies', label: 'Lit(s) bébé', hint: '- de 2 ans', min: 0 },
];

// Edition des chambres d'un sejour (espace prestataire : reservation),
// memes champs que le formulaire de demande "Maison d'hote" (ContactForm).
// `withPrice` : prix par nuit de chaque chambre (calcul automatique du total).
function RoomsEditor({ rooms, onChange, withPrice = false }) {
  const update = (index, field, value) =>
    onChange(rooms.map((room, i) => (i === index ? { ...room, [field]: Math.max(0, Number(value) || 0) } : room)));

  const updatePrice = (index, value) =>
    onChange(rooms.map((room, i) => (i === index ? { ...room, price: value === '' ? '' : Math.max(0, Number(value)) } : room)));

  return (
    <div className="space-y-3">
      {rooms.map((room, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-rose-600">Chambre {index + 1}</p>
            {rooms.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(rooms.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700"
                aria-label={`Supprimer la chambre ${index + 1}`}
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {FIELDS.map(({ field, label, hint, min }) => (
              <div key={field} className="min-w-0">
                <label className="block truncate text-xs font-medium text-gray-700">{label}</label>
                <span className="block truncate text-[11px] text-gray-400">{hint}</span>
                <input
                  type="number"
                  min={min}
                  value={room[field]}
                  onChange={(e) => update(index, field, e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          {withPrice && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700">Prix de la chambre / nuit (DT)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={room.price ?? ''}
                onChange={(e) => updatePrice(index, e.target.value)}
                placeholder="ex : 150"
                className={inputClass.replace('text-center', 'text-left')}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          // Nouvelle chambre : reprend le prix de la precedente (souvent identique).
          onChange([...rooms, { ...DEFAULT_ROOM, ...(withPrice && rooms.length ? { price: rooms[rooms.length - 1].price ?? '' } : {}) }])
        }
        className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
      >
        <IconPlus className="h-4 w-4" />
        Ajouter une chambre
      </button>
    </div>
  );
}

export default RoomsEditor;
