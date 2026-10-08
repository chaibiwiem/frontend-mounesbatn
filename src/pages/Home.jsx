import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getCitiesWithCounts, searchListings } from '../services/listingService';
import useDocumentMeta from '../hooks/useDocumentMeta';
import ListingCarousel from '../components/ListingCarousel';
import CategoryCarousel from '../components/CategoryCarousel';
import CategorySearchBar from '../components/CategorySearchBar';
import { IconChevronLeft, IconChevronRight, IconHeart } from '../components/icons';

// Meme repli visuel que StaticCategoryImage (PrestatairesLanding) : degrade
// rose + icone tant que l'image (dossier public/) n'a pas ete deposee, pour
// eviter l'icone "image cassee" du navigateur.
function PromoImage({ src, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-rose-100 to-rose-200 ${className}`}>
        <IconHeart className="h-10 w-10 text-rose-400" />
      </div>
    );
  }

  return (
    <img src={src} alt="" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

// Carte promo (titre + description + lien a gauche, photo a droite avec un
// grand rayon en haut-a-gauche qui "mord" sur le texte) - meme design que la
// reference fournie, adaptee aux deux points d'entree reels de Mounesba
// (une categorie phare, puis le catalogue complet des prestataires). Empilee
// (photo en haut, texte en dessous) sur mobile/tablette, cote a cote a partir
// de lg - la mise en page en ligne fixe (h-280px) ecrasait le texte sur les
// petits ecrans.
function PromoCard({ title, description, linkTo, linkLabel, imageSrc }) {
  return (
    <Link
      to={linkTo}
      className="group flex flex-col overflow-hidden rounded-3xl bg-gray-50 shadow-lg transition hover:shadow-xl lg:h-[280px] lg:flex-row"
    >
      <div className="order-2 flex w-full shrink-0 flex-col justify-center p-6 sm:p-8 lg:order-1 lg:w-1/2">
        <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
        <p className="mt-3 text-sm text-gray-600">{description}</p>
        <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-rose-600 group-hover:underline">
          {linkLabel}
          <IconChevronRight className="h-4 w-4" />
        </span>
      </div>
      {/* Grand rayon en haut-a-gauche uniquement en ligne (>=lg) : cree
          l'effet de "morsure" organique sur le panneau de texte, comme la
          reference. Sur mobile/tablette l'arrondi de la carte suffit. */}
      <div className="order-1 h-48 w-full shrink-0 overflow-hidden sm:h-56 lg:order-2 lg:h-full lg:w-1/2 lg:rounded-tl-[100px]">
        <PromoImage
          src={imageSrc}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
      </div>
    </Link>
  );
}

// Rangee de villes/regions actives (au moins un prestataire actif) avec leur
// nombre de fiches - meme structure (carte bordee + fleches de defilement)
// qu'une reference fournie, avec de vraies donnees Mounesba (villes gerees
// par l'admin, cf. CitiesTab.jsx, comptage reel des fiches actives).
function CityCarousel({ cities }) {
  const scrollRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const checkOverflow = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cities]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  if (!cities.length) return null;

  return (
    <div className="relative">
      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
          className="absolute left-0 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex snap-x scroll-smooth gap-4 overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city) => (
          <Link
            key={city.id}
            to={`/search?city=${encodeURIComponent(city.name)}`}
            className="w-[220px] shrink-0 snap-start rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rose-300 hover:shadow-md"
          >
            <p className="text-lg font-bold text-gray-900">{city.name}</p>
            <p className="mt-1 text-sm text-gray-500">
              {city.count} prestataire{city.count > 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>

      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Suivant"
          className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white p-2 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [cities, setCities] = useState([]);

  useDocumentMeta(
    'Mounesba — Prestataires pour mariage, henné et toutes vos occasions en Tunisie',
    'Trouvez les meilleurs prestataires pour vos occasions en Tunisie : salles de fête, traiteurs, photographes, décorateurs. Comparez et demandez vos devis gratuitement.'
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    searchListings({ sort: 'popularity', limit: 12 })
      .then((data) => setPopular(data.results))
      .catch(() => setPopular([]));
    getCitiesWithCounts()
      .then((data) => setCities(data.filter((city) => city.count > 0)))
      .catch(() => setCities([]));
  }, []);

  return (
    <div>
      {/* Banniere en deux colonnes (texte + recherche a gauche sur fond
          blanc, photo a droite avec un grand rayon "morsure" a gauche) -
          meme design que la reference fournie. Empilee (photo en haut,
          texte/recherche en dessous) sur mobile/tablette ; cote a cote a
          partir de lg. Pas de bouton "Telecharger l'app" (reference) :
          Mounesba est une plateforme web uniquement, cf. CLAUDE.md regle 4. */}
      {/* Pas d'overflow-hidden ici : ca coupait le mega-menu categories/
          villes de la barre de recherche, qui s'ouvre plus bas que la
          banniere elle-meme. Le rayon "morsure" de la photo est deja
          contenu par son propre wrapper overflow-hidden plus bas. */}
      <div className="w-full bg-white">
        {/* Mobile/tablette : photo courte en haut, texte + recherche en
            dessous sur fond blanc, empiles. */}
        <div className="lg:hidden">
          <img src="/banner.jpeg" alt="" className="h-56 w-full object-cover sm:h-72" />
          <div className="flex flex-col justify-center px-4 pt-10 pb-6 sm:px-8 sm:py-14">
            <h1
              className="text-gray-900"
              style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600 }}
            >
              Organisez l&apos;événement
              <br />
              de vos rêves
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Trouvez les meilleurs prestataires en Tunisie
            </p>
            <div className="mt-8">
              <CategorySearchBar categories={categories} />
            </div>
          </div>
        </div>

        {/* Desktop (lg+) : vraie mise en page 2 colonnes, texte a gauche
            pleine hauteur et photo a droite avec le rayon "morsure". */}
        <div className="hidden lg:grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-8 py-16 xl:px-16 xl:py-24">
            <h1 className="text-gray-900" style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', fontWeight: 600 }}>
              Organisez l&apos;événement
              <br />
              de vos rêves
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Trouvez les meilleurs prestataires en Tunisie
            </p>
            <div className="mt-8">
              <CategorySearchBar categories={categories} />
            </div>
          </div>
          {/* Pas de hauteur fixee : l'element grid s'etire (align-items:
              stretch par defaut) pour epouser exactement la hauteur de la
              colonne de texte a gauche, a n'importe quelle largeur d'ecran -
              une hauteur figee (min-h) rendait la photo disproportionnee des
              que la colonne retrecissait (lg). */}
          <div className="relative overflow-hidden rounded-l-[100px]">
            <img src="/banner.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="w-full !px-[50px]">
      <div className="pt-4 pb-6 sm:py-14">
        <h2 className="text-center text-2xl font-bold text-gray-900">Catégories</h2>
        <div className="mt-10">
          <CategoryCarousel
            categories={categories}
            onSelect={(cat) => navigate(`/categorie/${cat.slug}`)}
          />
        </div>
      </div>

      <div className="pb-16">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Amusez-vous en organisant votre événement
        </h2>
        <p className="mt-1 text-gray-600">Commencez à planifier votre événement avec nous, c'est gratuit !</p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PromoCard
            title="Lieux de mariage"
            description="Découvrez des lieux d'exception pour votre mariage, consultez les photos et avis, puis contactez-les en quelques clics."
            linkTo="/categorie/lieux-de-mariage"
            linkLabel="Découvrez les lieux"
            imageSrc="/lieux-de-reception.jpeg"
          />
          <PromoCard
            title="Prestataires"
            description="Découvrez les meilleurs professionnels et prestataires de services près de chez vous, partout en Tunisie."
            linkTo="/prestataires"
            linkLabel="Découvrir les prestataires"
            imageSrc="/prestataires.jpeg"
          />
        </div>
      </div>

      {popular.length > 0 && (
        <div className="pb-16">
          <h2 className="text-2xl font-bold text-gray-900">Prestataires sélectionnés</h2>
          <div className="mt-4">
            <ListingCarousel
              listings={popular}
              hideContactButton
              cardWidthClass="w-[80%] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            />
          </div>
        </div>
      )}

      {cities.length > 0 && (
        <div className="pb-16">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Professionnels de la fête par zone
          </h2>
          <div className="mt-8">
            <CityCarousel cities={cities} />
          </div>
        </div>
      )}

      {/* Bloc "A propos" - meme design que la reference fournie (photo a
          gauche, eyebrow + titre + texte + bouton fonce a droite), avec le
          vrai positionnement Mounesba (mise en relation par abonnement, sans
          paiement en ligne) au lieu du texte generique de la reference. */}
      <div className="pb-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-3xl">
            <PromoImage src="/about.jpg" className="h-64 w-full sm:h-80 lg:h-[420px]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Mounesba</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              La plateforme qui simplifie l'organisation de vos occasions
            </h2>
            <p className="mt-4 text-gray-600">
              Organiser une occasion demande du temps, des appels et beaucoup de recherches. Mounesba
              rassemble au même endroit les professionnels qui font vivre vos célébrations, du mariage au
              thour, des fiançailles à la fête de réussite et bien d'autres occasions. Comparez, contactez,
              décidez. Gratuitement.
            </p>
            <Link
              to="/prestataires"
              className="mt-8 inline-block rounded-lg bg-pink-400 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-pink-500"
            >
              Découvrir les prestataires
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Home;
