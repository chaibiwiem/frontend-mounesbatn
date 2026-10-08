import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconInstagram, IconFacebook, IconTikTok } from './icons';
import { getCategories } from '../services/listingService';

// Une section = un accordeon replie sur mobile/tablette (titre + "+"/"-",
// contenu masque tant que non ouvert - comme la reference fournie), une
// simple colonne toujours ouverte a partir de lg (pas de bouton/etat visible,
// juste le contenu directement affiche).
function FooterSection({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 py-4 lg:border-0 lg:py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left lg:pointer-events-none lg:cursor-default"
      >
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-lg leading-none text-gray-400 lg:hidden">{open ? '−' : '+'}</span>
      </button>
      <div className={`${open ? 'mt-4 block' : 'hidden'} lg:mt-4 lg:block`}>{children}</div>
    </div>
  );
}

// Pied de page global (toutes les pages publiques, cf. App.jsx) : colonnes de
// liens + reseaux sociaux, meme structure qu'une reference fournie par
// l'utilisateur - adaptee au perimetre reel de Mounesba (pas de pages
// CGU/FAQ/suivi de commande pour l'instant, pas d'inscription prestataire en
// libre-service - cf. CLAUDE.md, comptes prestataires crees par l'admin).
// Sur mobile/tablette, chaque colonne devient un accordeon (comme une autre
// reference fournie separement) plutot qu'une grille toujours deployee.
function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.slice(0, 4)))
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="w-full !px-[50px] py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-8">
          <FooterSection title="Informations">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-rose-600">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/prestataires" className="text-gray-600 hover:text-rose-600">
                  Prestataires
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-rose-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/centre-aide" className="text-gray-600 hover:text-rose-600">
                  Centre d&apos;aide
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Catégories">
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/categorie/${cat.slug}`} className="text-gray-600 hover:text-rose-600">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/search" className="font-medium text-gray-900 hover:text-rose-600">
                  Toutes les catégories →
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Espace prestataire">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-gray-600 hover:text-rose-600">
                  Connexion prestataire
                </Link>
              </li>
              <li>
                <Link to="/prestataires" className="text-gray-600 hover:text-rose-600">
                  Devenir prestataire
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Mon compte">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-gray-600 hover:text-rose-600">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-rose-600">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/client/dashboard" className="text-gray-600 hover:text-rose-600">
                  Mes réservations
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Réseaux sociaux">
            {/* Instagram, Facebook et TikTok ont tous de vrais comptes Mounesba. */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/mounesbatn/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mounesba sur Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
              >
                <IconInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61594699323909"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mounesba sur Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
              >
                <IconFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@mounesba.tn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mounesba sur TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
              >
                <IconTikTok className="h-4 w-4" />
              </a>
            </div>
          </FooterSection>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-gray-100 pt-6 text-center text-sm text-gray-600 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Mounesba. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/politique-de-confidentialite" className="hover:text-rose-600">
              Politique de confidentialité
            </Link>
            <Link to="/politique-de-cookies" className="hover:text-rose-600">
              Politique de cookies
            </Link>
            <Link to="/centre-legal" className="hover:text-rose-600">
              Centre légal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
