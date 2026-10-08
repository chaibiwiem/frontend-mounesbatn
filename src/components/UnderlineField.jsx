// Champ style "underline" (pas de cadre) avec icone alignee a droite,
// reference fournie par l'utilisateur - partage entre AuthModal (popup) et
// Register (page complete) pour ne pas dupliquer le style.
function UnderlineField({ label, icon: Icon, className = '', ...inputProps }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <div className="relative mt-1">
        <input
          {...inputProps}
          className="w-full border-0 border-b border-gray-300 bg-transparent px-0 py-2 pr-7 text-sm text-gray-900 focus:border-rose-500 focus:outline-none"
        />
        {Icon && (
          <Icon className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
      </div>
    </div>
  );
}

export default UnderlineField;
