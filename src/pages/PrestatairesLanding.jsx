import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, searchListings, getListingsByCategories } from '../services/listingService';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { CategoryIcon } from '../utils/categoryIcons';
import { IconChevronLeft, IconChevronRight } from '../components/icons';
import CategoryCarousel from '../components/CategoryCarousel';
import ListingCarousel from '../components/ListingCarousel';

// Image statique (dossier public/prestataires/...) avec repli visuel
// (icone sur degrade rose, meme style que CategoryCarousel) tant que le
// fichier n'a pas encore ete depose - evite l'icone "image cassee" du
// navigateur avant que les vrais visuels soient fournis.
function StaticCategoryImage({ src, category, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-rose-100 to-rose-200 ${className}`}
      >
        <CategoryIcon category={category} className="h-10 w-10 text-rose-500" />
      </div>
    );
  }

  return (
    <img loading="lazy" decoding="async" src={src} alt="" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

// Description + libelle du bouton du bandeau de chaque categorie principale
// (par slug reel, voir la table categories en base) - categories sans entree
// ici (ex. Fleuristes, Bijoux de mariage...) gardent le texte generique par
// defaut plus bas.
const CATEGORY_COPY = {
  'lieux-de-mariage': {
    description:
      'Salles de fête, hôtels, villas et espaces en plein air. Découvrez les photos, consultez les avis et contactez les lieux directement.',
    cta: 'Voir les lieux',
  },
  traiteurs: {
    description: 'Menus complets, buffets et plateaux salés. Comparez les offres et demandez vos devis en quelques clics.',
    cta: 'Voir les traiteurs',
  },
  'patisseries-douceurs': {
    description:
      'Gâteaux de mariage, pâtisseries orientales, dragées et chocolats. Trouvez le professionnel qui régalera vos invités.',
    cta: 'Voir les pâtissiers',
  },
  'photo-video': {
    description:
      'Photographes, vidéastes, drone et photobooth. Découvrez leurs réalisations et confiez-leur vos plus beaux souvenirs.',
    cta: 'Voir les photographes',
  },
  beaute: {
    description: 'Coiffure, maquillage, soins et onglerie. Préparez votre journée avec des professionnels de confiance.',
    cta: 'Voir les salons',
  },
  'spa-bien-etre': {
    description: 'Rituels hammam, massages et soins traditionnels. Offrez-vous un moment de détente avant le grand jour.',
    cta: 'Voir les spas',
  },
  'mode-et-accessoires': {
    description:
      'Robes de mariée, costumes, keswa tunisienne et accessoires. Location ou achat, trouvez la tenue qui vous ressemble.',
    cta: 'Voir les tenues',
  },
  decoration: {
    description: "Décorateurs, fleuristes, éclairage et mobilier. Donnez vie à l'ambiance dont vous rêvez.",
    cta: 'Voir les décorateurs',
  },
  transport: {
    description: 'Voitures de mariage, bus et navettes. Organisez les déplacements de vos invités en toute sérénité.',
    cta: 'Voir les transporteurs',
  },
  animation: {
    description: 'DJ, orchestres, troupes traditionnelles, zaffa et animation enfants. Faites vibrer votre soirée.',
    cta: 'Voir les animateurs',
  },
  'parfums-soins': {
    description:
      'Musc, bakhour, huiles naturelles et coffrets personnalisés. Des attentions parfumées pour vous et vos invités.',
    cta: 'Voir les prestataires',
  },
  'cartes-invitation': {
    description:
      'Faire-part imprimés, invitations digitales, menus et marque-places. Annoncez votre occasion avec élégance.',
    cta: 'Voir les créateurs',
  },
  'cadeaux-invites-mariage': {
    description: 'Dragées, coffrets et souvenirs personnalisés. Remerciez vos invités avec une attention qui leur ressemble.',
    cta: 'Voir les prestataires',
  },
  'voyages-lune-de-miel': {
    description:
      "Agences de voyage, séjours et lunes de miel sur mesure. Prolongez la fête par un voyage à votre image, en Tunisie ou à l'étranger.",
    cta: 'Voir les agences',
  },
  'evenements-professionnels': {
    description:
      "Séminaires, conférences, salons et soirées d'entreprise. Trouvez les professionnels qui donneront du souffle à vos événements corporate.",
    cta: 'Voir les prestataires',
  },
  'bijoux-mariage': {
    description:
      'Alliances, parures et bijoux traditionnels. Découvrez les créateurs et joailliers qui accompagneront votre plus beau jour.',
    cta: 'Voir les joailliers',
  },
  fleuriste: {
    description:
      'Bouquets de mariée, compositions florales et décoration végétale. Confiez vos fleurs à des artisans qui subliment chaque détail.',
    cta: 'Voir les fleuristes',
  },
};

// Page catalogue "Prestataires" (/prestataires) : bandeau carrousel puis une
// section par categorie principale presentant ses sous-categories en grille
// 2 colonnes avec legende - inspiree d'une mise en page magazine, adaptee au
// catalogue de sous-categories Mounesba (au lieu de familles de produits).
function PrestatairesLanding() {
  const navigate = useNavigate();
  const [allCategories, setAllCategories] = useState([]);
  const heroRef = useRef(null);

  useDocumentMeta(
    'Prestataires mariage & événements en Tunisie | Mounesba',
    'Trouvez les meilleurs prestataires pour votre mariage en Tunisie : salles des fêtes, photographes, traiteurs, robes, costumes, déco. Comparez et réservez.',
    {
      ogTitle: 'Prestataires mariage & événements en Tunisie | Mounesba',
      ogDescription:
        'Salles des fêtes, photographes, traiteurs, robes, costumes, déco… Comparez les prestataires près de chez vous et réservez sur Mounesba.',
      url: 'https://mounesba.vercel.app/prestataires',
    }
  );

  useEffect(() => {
    getCategories()
      .then(setAllCategories)
      .catch(() => setAllCategories([]));
  }, []);

  // Toutes les categories principales sont affichees, avec ou sans
  // sous-categories - une categorie sans sous-categorie affiche simplement
  // son bandeau + ses prestataires, sans carrousel de sous-categories.
  const categories = allCategories;

  const [categoryListings, setCategoryListings] = useState({});

  // Prestataires de chaque categorie affichee, presentes sous son bandeau
  // (titre + description + CTA + image) - avec ou sans sous-categories.
  // Une seule requete groupee (au lieu d'un appel par categorie, jusqu'a ~18
  // en parallele) : plus rapide (pas de file d'attente de connexions
  // navigateur) et evite d'epuiser le rate limiter sous trafic concurrent.
  useEffect(() => {
    if (categories.length === 0) return;
    getListingsByCategories(
      categories.map((cat) => cat.slug),
      8
    )
      .then((data) => {
        const byId = {};
        categories.forEach((cat) => {
          byId[cat.id] = data[cat.slug] || [];
        });
        setCategoryListings(byId);
      })
      .catch(() => setCategoryListings({}));
  }, [categories]);

  // Bandeau de cloture "Tous les prestataires..." : les categories
  // principales (pas leurs sous-categories) en puces, puis les prestataires
  // les plus populaires - affiche apres la liste des categories.
  const [popularListings, setPopularListings] = useState([]);

  useEffect(() => {
    searchListings({ sort: 'popularity', limit: 8 })
      .then((data) => setPopularListings(data.results))
      .catch(() => setPopularListings([]));
  }, []);

  // Largeur d'une slide = celle du premier enfant (100% sur mobile, 1/3 sur
  // desktop, cf. classes w-full sm:w-1/3) - jamais une valeur fixe, pour
  // rester correct a toute taille d'ecran.
  const getSlideWidth = () => heroRef.current?.firstElementChild?.offsetWidth || heroRef.current?.clientWidth || 0;

  const scrollHero = (direction) => {
    heroRef.current?.scrollBy({ left: direction * getSlideWidth(), behavior: 'smooth' });
  };

  // Defilement automatique toutes les 3s, boucle au debut une fois la
  // derniere slide atteinte - en pause si l'utilisateur n'a qu'une seule
  // categorie (rien a faire defiler).
  useEffect(() => {
    if (categories.length <= 1) return undefined;
    const interval = setInterval(() => {
      const el = heroRef.current;
      if (!el) return;
      const slideWidth = getSlideWidth();
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - slideWidth / 2;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + slideWidth,
        behavior: 'smooth',
      });
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  return (
    <div>
      <div className="w-full !px-[50px] py-6">
        <p className="text-sm text-gray-500">
          <Link to="/" className="hover:text-rose-600">
            Accueil
          </Link>{' '}
          / Prestataires
        </p>
      </div>

      {/* Bandeau plein ecran (edge-to-edge), volontairement hors du conteneur
          max-w/padding du reste de la page - comme la reference. */}
      {categories.length > 0 && (
        <div className="relative mt-4 w-full">
          <button
            type="button"
            onClick={() => scrollHero(-1)}
            aria-label="Précédent"
            className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={heroRef}
            className="flex snap-x scroll-smooth gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categorie/${cat.slug}`}
                className="group relative h-[280px] w-full shrink-0 snap-start overflow-hidden sm:h-[420px] sm:w-1/3"
              >
                <StaticCategoryImage
                  src={`/prestataires/hero/${cat.slug}.jpg`}
                  category={cat}
                  className="h-full w-full transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {cat.name}
                  </h2>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-white/90 group-hover:underline">
                    Découvrir <IconChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollHero(1)}
            aria-label="Suivant"
            className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="w-full !px-[50px]">
        {categories.map((cat) => (
          <div key={cat.id} className="py-[15px]">
            {/* Carrousel de sous-categories (tuiles circulaires + libelle,
                meme composant que Home/CategoryLanding) pour laisser le
                visiteur affiner avant de voir des prestataires - uniquement
                si la categorie a des sous-categories. */}
            {cat.children?.length > 0 && (
              <div className="rounded-3xl bg-gray-50 px-4 pb-6 pt-[30px] sm:px-10">
                <h2
                  className="text-center text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {cat.name}
                </h2>
                <div className="mt-8">
                  <CategoryCarousel
                    categories={cat.children}
                    onSelect={(sub) => navigate(`/search?category=${sub.slug}`)}
                  />
                </div>
              </div>
            )}

            {/* Bandeau (titre + description + CTA + image). */}
            <div
              className={`grid grid-cols-1 overflow-hidden rounded-3xl sm:grid-cols-2 sm:h-[400px] ${
                cat.children?.length > 0 ? 'mt-3' : 'mt-[30px]'
              }`}
            >
                <div className="flex flex-col justify-center bg-gray-50 p-8 sm:p-10">
                  <h2
                    className="line-clamp-2 text-2xl font-bold text-gray-900 sm:text-3xl"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {cat.name}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                    {CATEGORY_COPY[cat.slug]?.description ||
                      `Consultez les professionnels de la catégorie « ${cat.name} » et trouvez celui qui sera idéal pour votre événement.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/categorie/${cat.slug}`)}
                    className="mt-5 w-fit shrink-0 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    {CATEGORY_COPY[cat.slug]?.cta || `Voir ${cat.name.toLowerCase()}`}
                  </button>
                </div>
                <StaticCategoryImage
                  src={`/prestataires/hero/${cat.slug}.jpg`}
                  category={cat}
                  className="h-56 w-full sm:h-full"
                />
              </div>

            {/* Prestataires de la categorie (et de ses sous-categories),
                affiches sous le bandeau. */}
            <div className="mt-6">
              <ListingCarousel listings={categoryListings[cat.id]} />
            </div>
          </div>
        ))}

        {/* Bandeau de cloture : les categories principales en puces, puis
            les prestataires les plus populaires. */}
        {categories.length > 0 && (
          <div className="py-8">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Tous les prestataires de vos événements
            </h2>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate(`/search?category=${cat.slug}`)}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-rose-600 hover:text-rose-600"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <ListingCarousel listings={popularListings} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrestatairesLanding;
