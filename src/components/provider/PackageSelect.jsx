import { formatPackage } from '../../utils/packages';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

// Pack d'une reservation (catalogue de la fiche). `current` : pack deja lie,
// garde dans la liste meme s'il n'est plus propose.
function PackageSelect({ packages, current, value, onChange }) {
  const options =
    current && !packages.some((pkg) => pkg.id === current.id) ? [current, ...packages] : packages;
  if (options.length === 0) return null;

  return (
    <div>
      <label className={labelClass}>Pack choisi</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(options.find((pkg) => String(pkg.id) === e.target.value) || null)}
        className={inputClass}
      >
        <option value="">Aucun pack</option>
        {options.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            {formatPackage(pkg)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PackageSelect;
