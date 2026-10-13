import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCategories } from '../services/listingService';
import { CategoryIcon } from '../utils/categoryIcons';

// Megamenu "Prestataires" (Navbar) : grille d'icones pour les categories
// principales, alimentee par les vraies categories Mounesba (getCategories),
// pas des libelles fixes. Panneau pleine largeur (comme la reference) : pas
// de `position: relative` sur ce wrapper, pour que `absolute left-0 right-0`
// se positionne par rapport a <nav> (sticky, donc deja un containing block)
// et non par rapport a ce seul lien "Prestataires".
function PrestatairesMegaMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  // Actif quand la page catalogue "Prestataires" (sa propre route dediee)
  // est affichee - pas /categorie/:slug, deja couvert par les menus dedies
  // (Lieux de mariage/Evenements) quand c'est leur propre page.
  const isActive = location.pathname === '/prestataires';
  // Le panneau est `position: absolute` relatif a <nav> (pas a ce wrapper,
  // voir commentaire plus haut) : la zone survolee par la souris entre le
  // lien "Prestataires" et le panneau n'appartient donc pas a la boite de ce
  // wrapper, ce qui declenchait un onMouseLeave premature (menu ferme avant
  // meme d'atteindre une categorie). Fermeture temporisee + annulee par tout
  // mouseenter sur le lien OU le panneau, le temps que le curseur traverse
  // cet espace mort - pattern standard des mega-menus a survol.
  const closeTimeoutRef = useRef(null);

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 250);
  };

  useEffect(() => {
    if (open && !loaded) {
      getCategories()
        .then((data) => {
          setCategories(data);
          setLoaded(true);
        })
        .catch(() => setCategories([]));
    }
  }, [open, loaded]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <div ref={ref}>
      <Link
        to="/prestataires"
        onClick={() => {
          cancelClose();
          setOpen(false);
        }}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        className={`text-sm ${
          open || isActive ? 'font-medium text-rose-600' : 'font-normal text-black hover:text-rose-600'
        }`}
      >
        Prestataires
      </Link>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 right-0 top-full z-20 border-t border-gray-100 bg-white shadow-xl"
        >
          <div className="mx-auto max-w-7xl px-6 py-[50px] sm:!px-[90px]">
            <p className="text-base font-bold text-gray-900">Commencez à rechercher vos prestataires</p>

            <div className="mt-4 grid grid-cols-4 gap-x-4 gap-y-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categorie/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="-ml-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  <CategoryIcon category={cat} className="h-[35px] w-[35px] shrink-0 text-gray-900" />
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrestatairesMegaMenu;
