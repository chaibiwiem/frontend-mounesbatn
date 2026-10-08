import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCategories } from '../services/listingService';

const CATEGORY_SLUG = 'lieux-de-mariage';

// Megamenu "Lieux de mariage" (Navbar) : sous-categories de la fiche
// "Lieux de mariage" en deux colonnes de liens texte (comme la reference),
// alimentees par les vraies sous-categories Mounesba - meme structure et
// meme correctif de survol que PrestatairesMegaMenu (le panneau est
// `position: absolute` relatif a <nav>, pas a ce wrapper : fermeture
// temporisee + annulee par tout mouseenter sur le lien OU le panneau, sinon
// le menu se ferme avant que le curseur atteigne une sous-categorie).
function LieuxMariageMegaMenu() {
  const [open, setOpen] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const closeTimeoutRef = useRef(null);
  const location = useLocation();
  const isActive = location.pathname === `/categorie/${CATEGORY_SLUG}`;

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
          const parent = data.find((cat) => cat.slug === CATEGORY_SLUG);
          setSubCategories(parent?.children || []);
          setLoaded(true);
        })
        .catch(() => setSubCategories([]));
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

  // Deux colonnes equilibrees (comme la reference) plutot qu'une simple
  // liste verticale - moitie/moitie, pas de logique plus fine necessaire
  // pour la petite dizaine de sous-categories de cette famille.
  const half = Math.ceil(subCategories.length / 2);
  const columns = [subCategories.slice(0, half), subCategories.slice(half)];

  return (
    <div ref={ref}>
      <Link
        to={`/categorie/${CATEGORY_SLUG}`}
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
        Lieux de mariage
      </Link>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 right-0 top-full z-20 border-t border-gray-100 bg-white shadow-xl"
        >
          <div className="mx-auto max-w-7xl px-6 py-[50px] sm:!px-[90px]">
            <p className="text-base font-bold text-gray-900">Lieux de mariage</p>

            <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-6">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="space-y-6">
                  {column.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/search?category=${sub.slug}`}
                      onClick={() => setOpen(false)}
                      className="block text-sm text-gray-700 hover:text-rose-600"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LieuxMariageMegaMenu;
