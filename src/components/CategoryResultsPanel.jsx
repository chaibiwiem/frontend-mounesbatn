import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchListings, getCategories, getCities } from '../services/listingService';
import ListingCard from './ListingCard';
import CategorySearchBar from './CategorySearchBar';
import { IconStar } from './icons';

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
        <aside className="h-fit space-y-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
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
              <p className="text-sm text-gray-600">
                {data.pagination.total ?? data.results.length} résultat(s)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Note</option>
                <option value="popularity">Popularité</option>
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
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

export default CategoryResultsPanel;
