import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchListings, getCategories, getCities } from '../services/listingService';
import ListingCard from './ListingCard';
import CategorySearchBar from './CategorySearchBar';
import {
  IconStar,
  IconX,
  IconTrash,
  IconTag,
  IconMapPin,
  IconCoins,
  IconPercent,
  IconChevronDown,
} from './icons';

const SORT_OPTIONS = [
  ['relevance', 'Pertinence'],
  ['price_asc', 'Prix croissant'],
  ['price_desc', 'Prix décroissant'],
  ['rating', 'Note'],
  ['popularity', 'Popularité'],
];

const sheetInputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-[#4E8BC4] focus:outline-none focus:ring-1 focus:ring-[#4E8BC4]';

// Champ du panneau de filtres mobile : icone rose + libelle, puis le controle.
function SheetField({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Icon className="h-4 w-4 text-rose-500" />
        {label}
      </p>
      {children}
    </div>
  );
}

// Liste deroulante personnalisee (mobile/tablette) : remplace le <select>
// natif, dont la liste deborde de l'ecran en emulation mobile et n'a pas le
// design de l'application. `floating` : liste en surimpression sous le champ
// (barre de tri) ; sinon liste dans le flux, a la largeur du panneau.
function SheetSelect({ value, onChange, options, placeholder, disabled = false, floating = false, buttonClassName = '', renderValue }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  // Clic a l'exterieur : referme la liste.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const label = selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder;

  return (
    <div ref={rootRef} className={floating ? 'relative h-full' : ''}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          buttonClassName ||
          `flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition disabled:bg-gray-50 disabled:text-gray-400 ${
            open ? 'border-[#4E8BC4] ring-1 ring-[#4E8BC4]' : 'border-gray-200'
          } ${selected ? 'text-gray-800' : 'text-gray-500'}`
        }
      >
        <span className="truncate">{label}</span>
        <IconChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className={`max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
            floating ? 'absolute right-0 top-full z-30 mt-1 w-max min-w-full max-w-[calc(100vw-2rem)]' : 'mt-1'
          }`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value || '__all'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${
                    active ? 'bg-sky-50 font-semibold text-[#2f6aa1]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <span className="text-[#4E8BC4]">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SortIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
    </svg>
  );
}

function LayersIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  );
}

function ResetIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// Icone "reglages" (curseurs) du bouton Filtres - pas d'equivalent dans icons.jsx.
function FiltersIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

// Panneau filtres (sidebar) + grille de resultats - utilise par la page de
// recherche generale (/search) et par la page de destination d'une categorie
// sans sous-categories (/categorie/:slug), ou lockedCategorySlug pre-selectionne
// la categorie sans devoir naviguer vers /search. showHeader affiche le
// bandeau fil d'ariane + titre + barre de recherche (reserve a /search, la
// page categorie ayant deja son propre bandeau).
function CategoryResultsPanel({ lockedCategorySlug = '', showHeader = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [data, setData] = useState({ results: [], pagination: { page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  // Mobile/tablette (< lg) : filtres dans un panneau du bas, ouvert par le
  // bouton "Filtres". Desktop : sidebar toujours visible.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Panneau ouvert : la page derriere ne defile plus ; Echap le referme.
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

  const categorySlugs =
    searchParams.getAll('category').length > 0
      ? searchParams.getAll('category')
      : lockedCategorySlug
        ? [lockedCategorySlug]
        : [];
  const categorySlug = categorySlugs[0] || '';

  const filters = {
    q: searchParams.get('q') || '',
    category: categorySlugs,
    city: searchParams.get('city') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    minRating: searchParams.get('minRating') || '',
    promo: searchParams.get('promo') || '',
    minSeats: searchParams.get('minSeats') || '',
    vehicleType: searchParams.get('vehicleType') || '',
    sort: searchParams.get('sort') || 'relevance',
    page: searchParams.get('page') || '1',
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
  }, []);

  const fetchResults = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) params[key] = value;
      } else if (value) {
        params[key] = value;
      }
    });
    searchListings(params)
      .then(setData)
      .catch(() => setData({ results: [], pagination: { page: 1, totalPages: 1 } }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lockedCategorySlug]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => setSearchParams(new URLSearchParams());

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', page);
    setSearchParams(next);
  };

  const hasActiveFilters =
    categorySlugs.length > 0 ||
    filters.city ||
    filters.priceMin ||
    filters.priceMax ||
    filters.minRating ||
    filters.promo ||
    filters.minSeats ||
    filters.vehicleType;

  // Nombre de filtres actifs, affiche sur le bouton "Filtres" (mobile/tablette).
  const activeFilterCount = [
    categorySlugs.length > 0 && categorySlugs[0] !== lockedCategorySlug,
    filters.city,
    filters.priceMin || filters.priceMax,
    filters.minRating,
    filters.promo,
    filters.minSeats,
    filters.vehicleType,
  ].filter(Boolean).length;

  const flatCategories = categories.flatMap((cat) => [cat, ...cat.children]);
  const selectedCategory = flatCategories.find((cat) => cat.slug === categorySlug);

  // Filtres flotte (places/type de vehicule) : uniquement pertinents pour la
  // categorie Transport ou l'une de ses sous-categories (Location de
  // voitures/de bus) - pas de liste figee, on remonte au parent pour rester
  // correct si de nouvelles sous-categories Transport sont ajoutees plus tard.
  const selectedParentCategory = selectedCategory?.parentId
    ? categories.find((cat) => cat.id === selectedCategory.parentId)
    : selectedCategory;
  const isTransportCategorySelected =
    selectedCategory?.slug === 'transport' || selectedParentCategory?.slug === 'transport';

  const breadcrumbParent =
    selectedCategory?.parentId && categories.find((cat) => cat.id === selectedCategory.parentId);

  // Deux menus en cascade (Categorie puis Sous-categorie) plutot qu'une liste
  // a cocher : categories = categories principales uniquement, sous-categorie
  // = enfants de la categorie principale selectionnee (ou de son parent si
  // c'est deja une sous-categorie qui est selectionnee).
  const selectedMainCategory = selectedCategory?.parentId ? breadcrumbParent : selectedCategory;
  const subCategoryOptions = selectedMainCategory?.children || [];
  const selectedSubSlug = selectedCategory?.parentId ? selectedCategory.slug : '';

  const resultCount = data.pagination.total ?? data.results.length;

  // Filtres actifs en puces (mobile/tablette), chacune retirable. La categorie
  // imposee par une page categorie (lockedCategorySlug) n'est pas retirable.
  const activeChips = [
    selectedCategory &&
      selectedCategory.slug !== lockedCategorySlug && {
        key: 'category',
        label: selectedCategory.name,
        // Sous-categorie retiree -> retour a sa categorie principale.
        onRemove: () => updateFilter('category', selectedCategory.parentId ? breadcrumbParent?.slug || '' : ''),
      },
    filters.city && { key: 'city', label: filters.city, onRemove: () => updateFilter('city', '') },
    (filters.priceMin || filters.priceMax) && {
      key: 'budget',
      label:
        filters.priceMin && filters.priceMax
          ? `${filters.priceMin} - ${filters.priceMax} DT`
          : filters.priceMin
            ? `Dès ${filters.priceMin} DT`
            : `Jusqu'à ${filters.priceMax} DT`,
      onRemove: () => {
        const next = new URLSearchParams(searchParams);
        next.delete('priceMin');
        next.delete('priceMax');
        next.delete('page');
        setSearchParams(next);
      },
    },
    filters.minRating && {
      key: 'rating',
      label: `${filters.minRating}+ étoiles`,
      onRemove: () => updateFilter('minRating', ''),
    },
    filters.promo && { key: 'promo', label: 'Promotions', onRemove: () => updateFilter('promo', '') },
    filters.minSeats && {
      key: 'seats',
      label: `${filters.minSeats}+ places`,
      onRemove: () => updateFilter('minSeats', ''),
    },
    filters.vehicleType && {
      key: 'vehicle',
      label: filters.vehicleType,
      onRemove: () => updateFilter('vehicleType', ''),
    },
  ].filter(Boolean);

  const handleMainCategoryChange = (slug) => updateFilter('category', slug);
  const handleSubCategoryChange = (slug) => updateFilter('category', slug || selectedMainCategory?.slug || '');

  return (
    <div>
      {showHeader && (
        <div className="mb-8 bg-white">
          <div className="w-full !px-[50px] py-10">
            <p className="text-sm text-gray-500">
              <Link to="/" className="hover:text-rose-600">
                Accueil
              </Link>
              {breadcrumbParent && (
                <>
                  {' '}
                  /{' '}
                  <Link to={`/categorie/${breadcrumbParent.slug}`} className="hover:text-rose-600">
                    {breadcrumbParent.name}
                  </Link>
                </>
              )}
              {selectedCategory && <> / {selectedCategory.name}</>}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-6">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {selectedCategory ? selectedCategory.name : 'Résultats de recherche'}
              </h1>

              <CategorySearchBar
                key={categorySlug}
                categories={categories}
                defaultCategory={selectedCategory?.parentId ? '' : categorySlug}
                containerClassName="w-full max-w-2xl sm:w-[600px]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-6 !px-[50px] pb-16 lg:grid-cols-[240px_1fr]">
        {/* Mobile/tablette (< lg) : barre "Filtres" + tri, puis filtres actifs
            en puces ; les filtres s'ouvrent dans un panneau du bas. */}
        <div className="space-y-3 lg:hidden">
          <div className="grid grid-cols-[auto_1fr] gap-2 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F0508A] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#F0508A]/30 transition hover:bg-[#E03C78]"
            >
              <FiltersIcon className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#F0508A]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <SheetSelect
              floating
              value={filters.sort}
              onChange={(value) => updateFilter('sort', value)}
              options={SORT_OPTIONS.map(([value, label]) => ({ value, label }))}
              renderValue={(option) => (
                <span className="flex items-center gap-2">
                  <SortIcon className="h-4 w-4 shrink-0 text-gray-600" />
                  <span className="truncate">Trier : {option.label}</span>
                </span>
              )}
              buttonClassName="flex h-full w-full items-center justify-between gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-3 text-xs font-medium text-gray-800 shadow-sm sm:px-3 sm:text-sm"
            />
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="flex items-center gap-1.5 rounded-full bg-sky-50 py-1.5 pl-3 pr-2 text-xs font-medium text-sky-800 ring-1 ring-sky-100"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Retirer le filtre ${chip.label}`}
                    className="rounded-full p-0.5 hover:bg-sky-100"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#4E8BC4] hover:underline"
              >
                <IconTrash className="h-3.5 w-3.5" />
                Effacer
              </button>
            </div>
          )}

          <p className="text-sm text-gray-600">{resultCount} résultat(s)</p>
        </div>

        <aside className="hidden h-fit space-y-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:block">
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select
              value={selectedMainCategory?.slug || ''}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Toutes</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sous-catégorie</label>
            <select
              value={selectedSubSlug}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              disabled={subCategoryOptions.length === 0}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {subCategoryOptions.length > 0 ? 'Toutes' : 'Choisir une catégorie d\'abord'}
              </option>
              {subCategoryOptions.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {isTransportCategorySelected && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Places minimum</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ex: 8"
                  value={filters.minSeats}
                  onChange={(e) => updateFilter('minSeats', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type de véhicule</label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) => updateFilter('vehicleType', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="voiture">Voiture</option>
                  <option value="bus">Bus</option>
                  <option value="minibus">Minibus</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Ville / region</label>
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Toutes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Budget (DT)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => updateFilter('priceMin', e.target.value)}
                className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => updateFilter('priceMax', e.target.value)}
                className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Avis client</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5'].map((rating) => {
                const active = filters.minRating === rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => updateFilter('minRating', active ? '' : rating)}
                    className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconStar className="h-4 w-4" />
                    {rating}+
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filters.promo === 'true'}
              onChange={(e) => updateFilter('promo', e.target.checked ? 'true' : '')}
            />
            Promotions uniquement
          </label>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={fetchResults}
              className="w-full rounded-xl bg-[#4E8BC4] py-3 text-sm font-bold text-white transition hover:brightness-95"
            >
              Filtrer
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
            >
              Annuler filtres
            </button>
          </div>
        </aside>

        <div>
          {/* Desktop : compteur + tri ici (mobile/tablette : barre au-dessus). */}
          <div className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm font-semibold text-rose-600 underline-offset-2 hover:underline"
                >
                  Effacer filtres
                </button>
              )}
              <p className="text-sm text-gray-600">{resultCount} résultat(s)</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="mt-8 text-center text-sm text-gray-500">Chargement...</p>
          ) : data.results.length === 0 ? (
            <div className="mt-8 text-center text-sm text-gray-500">
              Aucun résultat. Essayez d&apos;élargir vos filtres.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-6 lg:grid-cols-3">
                {data.results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`h-8 w-8 rounded-full text-sm ${
                        Number(filters.page) === p
                          ? 'bg-rose-600 text-white'
                          : 'bg-white text-gray-600 ring-1 ring-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panneau de filtres (mobile/tablette) : glisse depuis le bas. Les
          filtres s'appliquent au fil de la saisie ; le bouton du bas affiche
          le nombre de resultats et referme le panneau. */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-2">
              <h2
                id="filters-sheet-title"
                className="flex items-center gap-2 text-lg font-bold text-gray-900"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                <FiltersIcon className="h-5 w-5 text-[#4E8BC4]" />
                Filtrer les prestataires
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fermer les filtres"
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5">
              <SheetField icon={IconTag} label="Catégorie">
                <SheetSelect
                  value={selectedMainCategory?.slug || ''}
                  onChange={handleMainCategoryChange}
                  options={[
                    { value: '', label: 'Toutes les catégories' },
                    ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
                  ]}
                />
              </SheetField>

              <SheetField icon={LayersIcon} label="Sous-catégorie">
                <SheetSelect
                  value={selectedSubSlug}
                  onChange={handleSubCategoryChange}
                  disabled={subCategoryOptions.length === 0}
                  placeholder="Choisir une catégorie d'abord"
                  options={
                    subCategoryOptions.length > 0
                      ? [
                          { value: '', label: 'Toutes les sous-catégories' },
                          ...subCategoryOptions.map((cat) => ({ value: cat.slug, label: cat.name })),
                        ]
                      : []
                  }
                />
              </SheetField>

              {isTransportCategorySelected && (
                <>
                  <SheetField icon={IconTag} label="Places minimum">
                    <input
                      type="number"
                      min="1"
                      placeholder="ex : 8"
                      value={filters.minSeats}
                      onChange={(e) => updateFilter('minSeats', e.target.value)}
                      className={sheetInputClass}
                    />
                  </SheetField>
                  <SheetField icon={IconTag} label="Type de véhicule">
                    <SheetSelect
                      value={filters.vehicleType}
                      onChange={(value) => updateFilter('vehicleType', value)}
                      options={[
                        { value: '', label: 'Tous' },
                        { value: 'voiture', label: 'Voiture' },
                        { value: 'bus', label: 'Bus' },
                        { value: 'minibus', label: 'Minibus' },
                      ]}
                    />
                  </SheetField>
                </>
              )}

              <SheetField icon={IconMapPin} label="Ville ou région">
                <SheetSelect
                  value={filters.city}
                  onChange={(value) => updateFilter('city', value)}
                  options={[{ value: '', label: 'Toutes les régions' }, ...cities.map((city) => ({ value: city, label: city }))]}
                />
              </SheetField>

              <SheetField icon={IconCoins} label="Budget (DT)">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['priceMin', 'Minimum'],
                    ['priceMax', 'Maximum'],
                  ].map(([key, placeholder]) => (
                    <div key={key} className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={placeholder}
                        value={filters[key]}
                        onChange={(e) => updateFilter(key, e.target.value)}
                        className={`${sheetInputClass} pr-10`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        DT
                      </span>
                    </div>
                  ))}
                </div>
              </SheetField>

              <SheetField icon={IconStar} label="Note des clients">
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5'].map((rating) => {
                    const active = filters.minRating === rating;
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateFilter('minRating', active ? '' : rating)}
                        aria-pressed={active}
                        className={`flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                          active
                            ? 'border-[#4E8BC4] bg-sky-50 text-[#2f6aa1]'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex">
                          {Array.from({ length: Number(rating) }, (_, i) => (
                            <IconStar key={i} className="h-3.5 w-3.5 text-[#4E8BC4]" />
                          ))}
                        </span>
                        {rating}+
                      </button>
                    );
                  })}
                </div>
              </SheetField>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <IconPercent className="h-4 w-4 text-rose-500" />
                  Promotions uniquement
                </span>
                <input
                  type="checkbox"
                  checked={filters.promo === 'true'}
                  onChange={(e) => updateFilter('promo', e.target.checked ? 'true' : '')}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-200 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-[#4E8BC4] peer-checked:after:translate-x-5" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#4E8BC4] py-3 text-sm font-semibold text-[#4E8BC4] transition hover:bg-sky-50"
              >
                <ResetIcon className="h-4 w-4" />
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-xl bg-[#4E8BC4] py-3 text-sm font-semibold text-white transition hover:brightness-95"
              >
                {loading ? 'Chargement...' : `Afficher ${resultCount} résultat${resultCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryResultsPanel;
