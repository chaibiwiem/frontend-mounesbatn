import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCategories } from '../services/listingService';
import AuthModal from './AuthModal';
import PrestatairesMegaMenu from './PrestatairesMegaMenu';
import LieuxMariageMegaMenu from './LieuxMariageMegaMenu';
import EvenementsMegaMenu from './EvenementsMegaMenu';
import { IconMenu, IconX, IconChevronRight, IconChevronLeft } from './icons';

// Categories/sous-categories ciblees par leur slug reel (voir la table
// categories en base). "Prestataires", "Lieux de mariage" et "Evenements"
// n'y figurent plus : remplaces par leurs propres menus deroulants
// (PrestatairesMegaMenu / LieuxMariageMegaMenu / EvenementsMegaMenu), voir
// plus bas.
const NAV_LINKS = [{ label: 'Contact', to: '/contact' }];

// Sur mobile/tablette (< lg), chaque megamenu devient une entree qui ouvre un
// sous-panneau (comme la reference fournie : fleche retour + titre + "Voir
// plus" + liste) plutot qu'un survol - meme contenu que les megamenus
// desktop, construit a partir du meme arbre de categories (recupere une
// seule fois a l'ouverture du tiroir, voir mobileCategories).
const MOBILE_MEGA_MENUS = {
  prestataires: {
    label: 'Prestataires',
    viewAllTo: '/prestataires',
    getItems: (categories) =>
      categories.map((cat) => ({ id: cat.id, label: cat.name, to: `/categorie/${cat.slug}` })),
  },
  'lieux-de-mariage': {
    label: 'Lieux de mariage',
    viewAllTo: '/categorie/lieux-de-mariage',
    getItems: (categories) => {
      const parent = categories.find((cat) => cat.slug === 'lieux-de-mariage');
      return (parent?.children || []).map((sub) => ({
        id: sub.id,
        label: sub.name,
        to: `/search?category=${sub.slug}`,
      }));
    },
  },
  evenements: {
    label: 'Événements',
    viewAllTo: '/categorie/evenements-professionnels',
    getItems: (categories) => {
      const parent = categories.find((cat) => cat.slug === 'evenements-professionnels');
      return (parent?.children || []).map((sub) => ({
        id: sub.id,
        label: sub.name,
        to: `/search?category=${sub.slug}`,
      }));
    },
  },
};

const MOBILE_MEGA_ORDER = ['prestataires', 'lieux-de-mariage', 'evenements'];

// Chemin du tableau de bord selon le role - un seul point de verite pour
// Navbar (lien "Tableau de bord") et AuthModal (redirection apres connexion).
function getDashboardPath(role) {
  if (role === 'provider') return '/prestataire/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/client/dashboard';
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'register'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Sous-panneau actuellement ouvert dans le tiroir mobile (cle de
  // MOBILE_MEGA_MENUS), null = liste principale.
  const [mobileSubmenuKey, setMobileSubmenuKey] = useState(null);
  const [mobileCategories, setMobileCategories] = useState([]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    getCategories()
      .then(setMobileCategories)
      .catch(() => setMobileCategories([]));
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileSubmenuKey(null);
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/');
  };

  const authSection = user ? (
    <>
      <Link to={getDashboardPath(user.role)} className="font-medium text-gray-600 hover:text-rose-600">
        Tableau de bord
      </Link>
      <span className="text-gray-600">
        Bonjour, <span className="font-medium text-gray-900">{user.firstName}</span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-rose-200 px-4 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50"
      >
        Déconnexion
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => {
          closeMobileMenu();
          setAuthMode('login');
        }}
        className="font-medium text-gray-600 hover:text-rose-600"
      >
        Connexion
      </button>
      <button
        type="button"
        onClick={() => {
          closeMobileMenu();
          setAuthMode('register');
        }}
        className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white transition hover:bg-rose-700"
      >
        Inscription
      </button>
    </>
  );

  return (
    <>
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between !px-[50px] py-3">
          <Link to="/" className="flex items-center">
            <img loading="lazy" decoding="async" src="/Mounesba_Logo_Horizontal.svg" alt="Mounesba" className="h-14 w-auto" />
          </Link>

          <div className="hidden items-center gap-9 lg:flex">
            <PrestatairesMegaMenu />
            <LieuxMariageMegaMenu />
            <EvenementsMegaMenu />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm ${
                  location.pathname === link.to
                    ? 'font-medium text-rose-600'
                    : 'font-normal text-black hover:text-rose-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 text-sm lg:flex">{authSection}</div>

          <button
            type="button"
            onClick={() => (mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true))}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            className="text-gray-600 hover:text-rose-600 lg:hidden"
          >
            {mobileMenuOpen ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile/tablette : tiroir depuis la gauche sur fond sombre
          (comme la reference fournie), pas plein ecran - rendu hors du <nav>
          pour la meme raison que AuthModal ci-dessous (`backdrop-blur` sur
          <nav> casserait le centrage/plein ecran d'un descendant `fixed`). */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => closeMobileMenu()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-[80%] max-w-sm overflow-y-auto bg-white"
          >
          <div className="flex items-center justify-end border-b border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => closeMobileMenu()}
              aria-label="Fermer le menu"
              className="text-gray-500 hover:text-gray-800"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>

          {mobileSubmenuKey ? (
            // Sous-panneau d'un megamenu (Prestataires/Lieux de mariage/
            // Mariée/Marié/Événements) : fleche retour + titre + "Voir plus"
            // + liste des sous-categories, comme la reference fournie.
            <nav>
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileSubmenuKey(null)}
                  aria-label="Retour"
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <Link
                  to={MOBILE_MEGA_MENUS[mobileSubmenuKey].viewAllTo}
                  onClick={() => closeMobileMenu()}
                  className="flex-1 text-center font-semibold text-gray-900 hover:text-rose-600"
                >
                  {MOBILE_MEGA_MENUS[mobileSubmenuKey].label}
                </Link>
                <span className="w-8" aria-hidden="true" />
              </div>

              <Link
                to={MOBILE_MEGA_MENUS[mobileSubmenuKey].viewAllTo}
                onClick={() => closeMobileMenu()}
                className="block border-b border-gray-100 px-6 py-3.5 font-semibold text-gray-900 hover:bg-gray-50"
              >
                Voir plus
              </Link>
              {MOBILE_MEGA_MENUS[mobileSubmenuKey].getItems(mobileCategories).map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => closeMobileMenu()}
                  className="block border-b border-gray-100 px-6 py-3.5 text-gray-700 hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav>
              {MOBILE_MEGA_ORDER.map((key) =>
                // "Prestataires" : le libelle mene directement a la page
                // /prestataires, la fleche ouvre toujours le sous-panneau.
                key === 'prestataires' ? (
                  <div key={key} className="flex items-stretch border-b border-gray-100">
                    <Link
                      to={MOBILE_MEGA_MENUS[key].viewAllTo}
                      onClick={() => closeMobileMenu()}
                      className="flex-1 px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {MOBILE_MEGA_MENUS[key].label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileSubmenuKey(key)}
                      aria-label={`Voir les catégories ${MOBILE_MEGA_MENUS[key].label}`}
                      className="flex items-center px-6 text-gray-400 hover:bg-gray-50"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileSubmenuKey(key)}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {MOBILE_MEGA_MENUS[key].label}
                  <IconChevronRight className="h-4 w-4 text-gray-400" />
                </button>
                )
              )}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => closeMobileMenu()}
                  className="flex items-center justify-between border-b border-gray-100 px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {link.label}
                  <IconChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </nav>
          )}

          <div className="border-t border-gray-100 py-2">
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => closeMobileMenu()}
                  className="block px-6 py-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Tableau de bord
                </Link>
                <div className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-sm text-gray-600">
                    Bonjour, <span className="font-medium text-gray-900">{user.firstName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    setAuthMode('login');
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-rose-600"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    setAuthMode('register');
                  }}
                  className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Inscription
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Rendu hors du <nav> : ce dernier a `backdrop-blur`, et un
          `backdrop-filter` sur un ancetre cree un containing block pour les
          descendants `fixed`, ce qui casserait le centrage plein ecran de la
          modale (elle se centrerait dans la hauteur de la barre, pas de la
          page). */}
      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </>
  );
}

export default Navbar;
