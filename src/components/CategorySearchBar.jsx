import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities } from '../services/listingService';
import { CategoryIcon } from '../utils/categoryIcons';
import { IconSearch, IconChevronDown, IconMapPin, IconX } from './icons';

// Barre de recherche pill (categorie + ville) - utilisee sur la page
// d'accueil et sur la page de destination d'une categorie (categorie
// pre-selectionnee via defaultCategory). Les deux champs ouvrent un
// mega-menu (categories : principales en gras + icone, sous-categories en
// dessous en texte normal ; villes : liste espacee avec icone localisation)
// plutot que des <select> natifs.
function CategorySearchBar({
  categories,
  defaultCategory = '',
  className = '',
  containerClassName = 'mx-auto max-w-2xl',
}) {
  const navigate = useNavigate();
  const [category, setCategory] = useState(defaultCategory);
  const [city, setCity] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [cityMenuLeft, setCityMenuLeft] = useState(0);
  const [cities, setCities] = useState([]);
  const [mobileQuery, setMobileQuery] = useState('');
  const containerRef = useRef(null);
  const cityFieldRef = useRef(null);

  useEffect(() => {
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
        setCityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const flatCategories = categories.flatMap((cat) => [cat, ...(cat.children || [])]);
  const selectedCategory = flatCategories.find((cat) => cat.slug === category);

  const selectCategory = (slug) => {
    setCategory(slug);
    setMenuOpen(false);
    setMobileQuery('');
  };

  // Recherche texte dans le panneau plein ecran mobile/tablette : conserve
  // une categorie principale si son nom correspond, ou si l'une de ses
  // sous-categories correspond (dans ce cas on n'affiche que les
  // sous-categories qui correspondent, pas toutes).
  const normalizedMobileQuery = mobileQuery.trim().toLowerCase();
  const mobileFilteredCategories = normalizedMobileQuery
    ? categories
        .map((cat) => {
          const catMatches = cat.name.toLowerCase().includes(normalizedMobileQuery);
          const matchingChildren = (cat.children || []).filter((sub) =>
            sub.name.toLowerCase().includes(normalizedMobileQuery)
          );
          if (!catMatches && matchingChildren.length === 0) return null;
          return { ...cat, children: catMatches ? cat.children : matchingChildren };
        })
        .filter(Boolean)
    : categories;

  const selectCity = (c) => {
    setCity(c);
    setCityMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    const qs = params.toString();
    navigate(`/search${qs ? `?${qs}` : ''}`);
  };

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      <form
        onSubmit={handleSearch}
        className={`flex flex-col items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:flex-row sm:items-center ${className}`}
      >
        <div className="relative flex min-w-0 flex-1 items-center gap-2 px-5 py-3 text-left">
          <IconSearch className="h-4 w-4 shrink-0 text-gray-400" />
          <button
            type="button"
            onClick={() => {
              // Le panneau (jusqu'a 880px) est ancre par defaut sur le bord
              // gauche du champ - mais ce champ n'est pas toujours pres du
              // bord gauche de l'ecran (ex. barre de recherche alignee a
              // droite sur les pages categorie), ce qui le faisait deborder
              // hors du viewport. On recale l'ancrage ici pour qu'il reste
              // toujours visible entierement.
              if (!menuOpen && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const margin = 16;
                const panelWidth = Math.min(window.innerWidth * 0.94, 880);
                let left = 0;
                const overflowRight = rect.left + left + panelWidth - (window.innerWidth - margin);
                if (overflowRight > 0) left -= overflowRight;
                if (rect.left + left < margin) left += margin - (rect.left + left);
                setMenuLeft(left);
              }
              setMenuOpen((open) => !open);
              setCityMenuOpen(false);
            }}
            className={`w-full truncate pr-5 text-left text-sm focus:outline-none ${
              selectedCategory ? 'text-gray-900' : 'text-gray-600'
            }`}
          >
            {selectedCategory ? selectedCategory.name : 'Prestataire ou catégorie'}
          </button>
          <IconChevronDown
            className={`pointer-events-none absolute right-4 h-3.5 w-3.5 text-gray-400 transition ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        <div className="hidden h-8 w-px bg-gray-400 sm:block" />

        <div ref={cityFieldRef} className="relative flex min-w-0 flex-1 items-center gap-2 border-t border-gray-400 px-5 py-3 text-left sm:border-t-0">
          <IconMapPin className="h-4 w-4 shrink-0 text-gray-400" />
          <button
            type="button"
            onClick={() => {
              if (!cityMenuOpen && cityFieldRef.current) {
                setCityMenuLeft(cityFieldRef.current.offsetLeft);
              }
              setCityMenuOpen((open) => !open);
              setMenuOpen(false);
            }}
            className={`w-full truncate pr-5 text-left text-sm focus:outline-none ${
              city ? 'text-gray-900' : 'text-gray-600'
            }`}
          >
            {city || 'Ville ou région'}
          </button>
          <IconChevronDown
            className={`pointer-events-none absolute right-4 h-3.5 w-3.5 text-gray-400 transition ${
              cityMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        <button
          type="submit"
          className="m-1.5 shrink-0 rounded-lg bg-pink-400 px-8 py-3 text-sm font-bold text-white transition hover:bg-pink-500"
        >
          Rechercher
        </button>
      </form>

      {cityMenuOpen && (
        <div
          className="absolute top-full z-20 mt-2 max-h-[70vh] w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-gray-100 bg-white text-left shadow-xl"
          style={{ left: cityMenuLeft }}
        >
          <div className="divide-y divide-gray-100">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCity(c)}
                className="flex w-full items-center gap-3 px-5 py-3.5 !font-[500] text-gray-900 transition hover:bg-gray-50"
              >
                <IconMapPin className="h-6 w-6 shrink-0 text-gray-400" />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="absolute top-full z-20 mt-2 hidden max-h-[75vh] w-[min(94vw,880px)] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-xl sm:block"
          style={{ left: menuLeft }}
        >
          <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {categories.map((cat) => {
              return (
                <div key={cat.id} className="mb-6 break-inside-avoid">
                  <button
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className="flex items-center gap-2 text-left !font-[500] text-gray-900 hover:text-rose-600"
                  >
                    <CategoryIcon category={cat} className="h-[35px] w-[35px] shrink-0 text-gray-700" />
                    {cat.name}
                  </button>
                  {cat.children?.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => selectCategory(sub.slug)}
                            className="text-sm text-gray-600 hover:text-rose-600"
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile/tablette : panneau plein ecran (au lieu du dropdown ancre,
          trop etroit et sujet au debordement sur petit ecran) - meme
          principe qu'une reference courante (titre + recherche texte +
          liste a une colonne), avec un champ de recherche qui filtre les
          categories/sous-categories affichees. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <h2 className="text-lg font-bold text-gray-900">Que cherchez-vous ?</h2>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setMobileQuery('');
              }}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5">
              <IconSearch className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder="Nom ou catégorie de prestataires"
                className="w-full text-sm text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {mobileFilteredCategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Aucune catégorie ne correspond.</p>
            ) : (
              mobileFilteredCategories.map((cat) => (
                <div key={cat.id} className="border-b border-gray-50 py-1">
                  <button
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className="flex w-full items-center gap-3 py-2.5 text-left !font-[500] text-gray-900"
                  >
                    <CategoryIcon category={cat} className="h-6 w-6 shrink-0 text-gray-700" />
                    {cat.name}
                  </button>
                  {cat.children?.length > 0 && (
                    <ul className="pb-2 pl-9">
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => selectCategory(sub.slug)}
                            className="w-full py-2 text-left text-sm text-gray-600"
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategorySearchBar;
