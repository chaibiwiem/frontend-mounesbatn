import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getListing, getListingBySlug, getSimilarListings, getCategories } from '../services/listingService';
import { getListingVehicles } from '../services/vehicleService';
import { getPublicListingEvents } from '../services/providerEventService';
import ListingCard from '../components/ListingCard';
import ContactForm from '../components/ContactForm';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import VideoGalleryModal from '../components/VideoGalleryModal';
import VideoPlayerModal from '../components/VideoPlayerModal';
import ReviewsSection from '../components/ReviewsSection';
import VehicleFleetSection from '../components/VehicleFleetSection';
import ProviderEventsSection from '../components/ProviderEventsSection';
import EventInterestForm from '../components/EventInterestForm';
import FavoriteButton from '../components/FavoriteButton';
import {
  IconPlay,
  IconUsers,
  IconMapPin,
  IconStar,
  IconTag,
  IconCoins,
  IconChevronLeft,
  IconArrowLeft,
  IconShare,
} from '../components/icons';
import ShareModal from '../components/ShareModal';
import { EVENT_TYPE_ICONS, ALL_EVENT_TYPES } from '../utils/eventTypes';
import { AMENITY_ICON_MAP, DEFAULT_AMENITY_ICON } from '../utils/amenities';
import { safeExternalUrl } from '../utils/safeUrl';

function MediaTile({ media, className = '', onClick }) {
  const isVideo = media.mediaType === 'video';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block overflow-hidden bg-gray-900 ${className}`}
    >
      {isVideo ? (
        media.thumbnailUrl ? (
          <img src={media.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 to-black" />
        )
      ) : (
        <img src={media.url} alt="" className="h-full w-full object-cover" />
      )}
      {isVideo && (
        <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow transition group-hover:bg-white">
          <IconPlay className="ml-0.5 h-4 w-4" />
        </span>
      )}
    </button>
  );
}

// Retour en bouton rond pose sur la photo (mobile/tablette), meme style que
// le coeur favori en face - reference fournie.
function BackCircleButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour"
      className={`z-10 flex items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-white ${className}`}
    >
      <IconArrowLeft className="h-5 w-5" />
    </button>
  );
}

function ShareCircleButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Partager"
      className={`z-10 flex items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-white ${className}`}
    >
      <IconShare className="h-4 w-4" />
    </button>
  );
}

function ListingDetail() {
  // Deux formes d'URL possibles : legacy /listings/:id (numerique) ou
  // publique SEO /:categorySlug/:listingSlug (voir App.jsx).
  const { id, categorySlug, listingSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState('');
  // Formulaire de contact toujours visible dans la sidebar (plus de popup) -
  // cette ref permet d'y faire defiler la page quand une action ailleurs sur
  // la fiche (choix d'un vehicule...) doit attirer l'attention dessus.
  const contactFormRef = useRef(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState(null);
  // "Reserver" sur un vehicule de la flotte : ouvre la demande de location
  // en popup (pre-remplie avec ce vehicule/decoration), sans devoir remonter
  // jusqu'au formulaire de la sidebar.
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  // Popup de demande ouvert depuis la barre fixe mobile/tablette.
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Espace reserve en bas de page (sous lg) pour la barre fixe "Demander un
  // devis" : pose sur <body> (pas seulement sur le contenu de la fiche) pour
  // que le pied de page - copyright, liens legaux - ne soit jamais masque.
  useEffect(() => {
    document.body.classList.add('pb-24', 'lg:pb-0');
    return () => document.body.classList.remove('pb-24', 'lg:pb-0');
  }, []);
  const [events, setEvents] = useState([]);
  // Evenement pour lequel le client a clique "Je suis interesse(e)" : ouvre
  // EventInterestForm (formulaire dedie, distinct de ContactForm) plutot que
  // la demande de devis/reservation classique.
  const [interestedEvent, setInterestedEvent] = useState(null);
  // Determine le type de formulaire de contact selon la categorie de la
  // fiche (principale ou l'une de ses sous-categories) : 'transport'
  // (location de vehicule), 'product' (commande produit, "Parfums &
  // Soins") ou 'standard' (demande d'evenement classique, par defaut). Ne
  // peut pas se deduire de `vehicles.length` seul : un prestataire Transport
  // sans vehicule encore ajoute doit quand meme avoir le formulaire location.
  const [contactFormVariant, setContactFormVariant] = useState('standard');

  const fetchListing = () =>
    id ? getListing(id) : getListingBySlug(categorySlug, listingSlug);

  useEffect(() => {
    setListing(null);
    setError('');
    setVehicles([]);
    setSelectedVehicleId(null);
    setRentalModalOpen(false);
    setRequestModalOpen(false);
    setEvents([]);
    setInterestedEvent(null);
    setContactFormVariant('standard');
    fetchListing()
      .then((data) => {
        setListing(data);
        // Pas de package selectionne par defaut : c'est au client de choisir.
        setSelectedPackageId(null);
        getSimilarListings(data.id)
          .then(setSimilar)
          .catch(() => setSimilar([]));
        // Flotte de vehicules : n'existe que pour les prestataires de la
        // categorie Transport, tableau vide sinon (aucun changement d'UI a gerer).
        getListingVehicles(data.id)
          .then(setVehicles)
          .catch(() => setVehicles([]));
        // "Mes evenements" (M5) : evenements publies et a venir uniquement,
        // ouvert a tous les prestataires (pas seulement Transport).
        getPublicListingEvents(data.id)
          .then(setEvents)
          .catch(() => setEvents([]));
        getCategories()
          .then((categories) => {
            const belongsTo = (category) =>
              Boolean(
                category &&
                  (category.id === data.categoryId ||
                    category.children?.some((child) => child.id === data.categoryId))
              );
            const transportCategory = categories.find((c) => c.slug === 'transport');
            const productCategory = categories.find((c) => c.slug === 'parfums-soins');
            // "Maison d'hote" est une sous-categorie de "Lieux de mariage"
            // (jamais une categorie principale) : contrairement a
            // transport/product ci-dessus (qui couvrent toute la categorie et
            // ses enfants), seule CETTE sous-categorie precise beneficie du
            // formulaire sejour - les autres sous-categories de "Lieux de
            // mariage" (Salle de fete, Hotel, Villa, Restaurant) gardent le
            // formulaire standard.
            const accommodationSubcategory = categories
              .flatMap((c) => c.children || [])
              .find((child) => child.slug === 'maisons-hotes');
            if (belongsTo(transportCategory)) setContactFormVariant('transport');
            else if (belongsTo(productCategory)) setContactFormVariant('product');
            else if (accommodationSubcategory && data.categoryId === accommodationSubcategory.id)
              setContactFormVariant('accommodation');
            else setContactFormVariant('standard');
          })
          .catch(() => setContactFormVariant('standard'));
      })
      .catch(() => setError("Ce prestataire est introuvable ou n'est plus disponible."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, categorySlug, listingSlug]);

  const refreshListing = () => {
    fetchListing()
      .then(setListing)
      .catch(() => {});
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/search" className="mt-4 inline-block text-rose-600 hover:underline">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <p className="py-16 text-center text-sm text-gray-500">Chargement...</p>;
  }

  // Mosaique : a gauche 1 video (celle du prestataire) si elle existe, sinon
  // repli sur la 1ere image ; a droite uniquement des images (jamais une 2e
  // video), pour ne pas melanger les deux types de media sur les tuiles
  // secondaires. Les videos additionnelles restent accessibles via "Voir Vidéos".
  // 4 tuiles a droite (grille 2x2 sur 2 colonnes x 2 lignes), comme la
  // reference - pas 3 (qui forcait une tuile large en bas, cassant la grille).
  const videoMedia = (listing.videos || []).map((v) => ({ ...v, mediaType: 'video' }));
  const imageMedia = (listing.images || []).map((i) => ({ ...i, mediaType: 'image' }));
  const hero = videoMedia[0] || imageMedia[0];
  const secondaryTiles = (hero?.mediaType === 'video' ? imageMedia : imageMedia.slice(1)).slice(0, 4);

  const handleTileClick = (media) => {
    if (!media) return;
    if (media.mediaType === 'video') setPlayingVideo(media);
    else setShowGallery(true);
  };

  // "Retour" : page precedente du site (recherche, categorie, accueil...).
  // Fiche ouverte directement (lien partage, Google, nouvel onglet) : pas de
  // page precedente dans le site (location.key === 'default') - on renvoie
  // alors vers la categorie de la fiche plutot que de quitter Mounesba.
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    const categoryPath = listing.category?.parent?.slug || listing.category?.slug;
    navigate(categoryPath ? `/categorie/${categoryPath}` : '/prestataires');
  };

  // Reglages du formulaire de demande, partages par le formulaire integre a
  // la page et par le popup ouvert depuis la barre fixe mobile/tablette : le
  // formulaire s'adapte au type de prestataire (devis, location, commande,
  // sejour) et reprend le vehicule / pack deja choisi sur la fiche.
  const contactFormProps = {
    listingId: listing.id,
    variant: contactFormVariant,
    vehicles,
    products: listing.packages,
    initialVehicleId: selectedVehicleId,
    initialDecorationId: selectedDecorationId,
    initialPackageId: contactFormVariant !== 'product' ? selectedPackageId : null,
    // Pack coche : repris dans le message (formulaire standard et maison
    // d'hote - produit/transport ont leur propre selection).
    initialMessage:
      ['standard', 'accommodation'].includes(contactFormVariant) && selectedPackageId
        ? `Forfait souhaité : ${listing.packages.find((pkg) => pkg.id === selectedPackageId)?.name || ''}`
        : '',
  };

  const REQUEST_BUTTON_LABELS = {
    transport: 'Demande de location',
    product: 'Commander',
    accommodation: 'Demande de réservation',
    standard: 'Demander un devis',
  };

  return (
    <div className="w-full !px-[50px] py-6">
      {/* Ligne Retour / Partager (ordinateur). Sous lg, ces deux actions sont
          des boutons ronds poses sur la photo - sauf fiche sans photo. */}
      <div className={`mb-4 items-center justify-between gap-3 ${hero ? 'hidden lg:flex' : 'flex'}`}>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 py-1 text-base font-semibold text-gray-900 transition hover:text-rose-600 sm:text-lg"
        >
          <IconChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          Retour
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <IconShare className="h-4 w-4" />
            Partager
          </button>
          {/* Favoris : ici sur ordinateur (lg+) ; sous lg, coeur rond pose
              sur la photo. Fiche sans photo : toujours ici. */}
          <FavoriteButton
            listingId={listing.id}
            initialFavorited={Boolean(listing.isFavorited)}
            label="Favoris"
          />
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          url={`${window.location.origin}${location.pathname}`}
          title={listing.title}
          onClose={() => setShareOpen(false)}
        />
      )}

      {!hero ? (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 sm:h-96">
          Pas de photo
        </div>
      ) : (
        <>
          {/* Mobile : hero pleine largeur + tuiles secondaires en grille 2 colonnes
              (hauteurs fixes independantes, pas de mosaique a hauteur partagee qui
              deborderait sur petit ecran). */}
          <div className="sm:hidden">
            <div className="relative">
              <MediaTile
                media={hero}
                onClick={() => handleTileClick(hero)}
                className="h-56 w-full rounded-2xl"
              />
              <FavoriteButton
                listingId={listing.id}
                initialFavorited={Boolean(listing.isFavorited)}
                className="absolute right-3 top-3 h-9 w-9"
              />
              <BackCircleButton onClick={handleBack} className="absolute left-3 top-3 h-9 w-9" />
              <ShareCircleButton onClick={() => setShareOpen(true)} className="absolute right-14 top-3 h-9 w-9" />
            </div>
            {secondaryTiles.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {secondaryTiles.map((media, index) => (
                  <MediaTile
                    key={`${media.mediaType}-${media.id}-m`}
                    media={media}
                    onClick={() => handleTileClick(media)}
                    className={`h-28 w-full rounded-xl ${
                      index === 2 && secondaryTiles.length === 3 ? 'col-span-2' : ''
                    }`}
                  />
                ))}
              </div>
            )}
            {(listing.videos?.length > 0 || listing.images?.length > 0) && (
              <div className="mt-2 flex gap-2">
                {listing.videos?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowVideoGallery(true)}
                    className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Voir Vidéos {listing.videos.length}
                  </button>
                )}
                {listing.images?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Voir Photos {listing.images.length}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop : mosaique 2 lignes - tuile principale (photo ou video) a
              gauche sur 45% de la largeur, les autres tuiles se partagent les
              55% restants en 2 colonnes - avec boutons superposes. */}
          <div className="relative hidden h-[530px] gap-2 overflow-hidden rounded-2xl sm:grid sm:grid-cols-[45%_1fr_1fr] sm:grid-rows-2">
            <MediaTile
              media={hero}
              onClick={() => handleTileClick(hero)}
              className="col-span-1 row-span-2 h-full w-full"
            />
            {secondaryTiles.map((media, index) => (
              <MediaTile
                key={`${media.mediaType}-${media.id}`}
                media={media}
                onClick={() => handleTileClick(media)}
                className={`h-full w-full ${
                  index === 2 && secondaryTiles.length === 3 ? 'col-span-2' : 'col-span-1'
                }`}
              />
            ))}

            <FavoriteButton
              listingId={listing.id}
              initialFavorited={Boolean(listing.isFavorited)}
              className="absolute right-3 top-3 h-10 w-10 lg:hidden"
            />
            <BackCircleButton onClick={handleBack} className="absolute left-3 top-3 h-10 w-10 lg:hidden" />
            <ShareCircleButton
              onClick={() => setShareOpen(true)}
              className="absolute right-[60px] top-3 h-10 w-10 lg:hidden"
            />

            {(listing.videos?.length > 0 || listing.images?.length > 0) && (
              <div className="absolute bottom-3 right-3 flex gap-2">
                {listing.videos?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowVideoGallery(true)}
                    className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Voir Vidéos {listing.videos.length}
                  </button>
                )}
                {listing.images?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white"
                  >
                    Voir Photos {listing.images.length}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* 3 blocs en ordre de code (mobile, 1 colonne) : titre+description,
          PUIS la sidebar (carte prestataire + devis), PUIS le reste (equipements,
          evenements, flotte, avis, types d'evenements) - pour que la sidebar
          apparaisse juste apres la description sur mobile/tablette au lieu
          d'etre repoussee en bas de page. Sur desktop (lg:), repositionnee en
          grille : bloc 1 et bloc 3 empiles dans la colonne de gauche, sidebar
          sur toute la hauteur dans la colonne de droite (disposition d'origine). */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <a
                href={
                  safeExternalUrl(listing.googleMapsUrl) ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    listing.address ? `${listing.city}, ${listing.address}` : listing.city
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-5 flex items-center gap-1 !font-medium text-black hover:text-rose-600 hover:underline"
                style={{ fontSize: '18px' }}
              >
                <IconMapPin className="h-6 w-6 shrink-0 text-black" />
                <span>{listing.address ? `${listing.city}, ${listing.address}` : listing.city}</span>
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              {listing.ratingCount > 0 ? (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconStar
                        key={star}
                        className={`h-4 w-4 fill-current ${
                          star <= Math.round(Number(listing.ratingAvg))
                            ? 'text-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {Number(listing.ratingAvg).toFixed(1)}
                  </span>
                  <span className="text-gray-500">({listing.ratingCount})</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Nouveau prestataire</span>
              )}
            </div>
          </div>

          {(listing.isVerified || listing.yearsExperience > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.isVerified && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  ✓ Vérifié
                </span>
              )}
              {listing.yearsExperience > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {listing.yearsExperience} an{listing.yearsExperience > 1 ? 's' : ''} d&apos;expérience
                </span>
              )}
            </div>
          )}

          <p className="mt-4 whitespace-pre-line text-gray-700">{listing.description}</p>
        </div>

        <div className="h-fit space-y-6 lg:col-start-2 lg:row-start-1 lg:row-span-2">
        <aside className="rounded-2xl border border-gray-100 px-7 py-5 shadow-xl shadow-gray-200/60">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            {listing.logoUrl ? (
              <img
                src={listing.logoUrl}
                alt={listing.title}
                className="h-14 w-14 shrink-0 rounded-full border border-gray-100 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-50 text-lg font-bold text-rose-600">
                {listing.title?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-gray-900">{listing.title}</p>
              {listing.fastResponseBadge && (
                <p className="text-sm text-gray-500">
                  Répond généralement sous <span className="font-semibold text-gray-900">24h</span>
                </p>
              )}
              {/* Evenements realises via Mounesba (M13) : demandes abouties,
                  confirmees par le prestataire et validees par Mounesba. */}
              {listing.realizedEventsCount > 0 && (
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{listing.realizedEventsCount}</span>{' '}
                  {listing.realizedEventsCount > 1 ? 'événements réalisés' : 'événement réalisé'} via Mounesba
                </p>
              )}
            </div>
          </div>

          {Number(listing.priceFrom) > 0 && (
            <div className="mb-3 flex items-center gap-3 py-2">
              <IconCoins className="h-5 w-5 shrink-0 text-gray-900" />
              <p className="text-sm text-gray-900">
                Tarif à partir de <span className="font-medium">{listing.priceFrom} DT</span>
                {Number(listing.priceTo) > 0 && (
                  <>
                    {' '}
                    · jusqu&apos;à <span className="font-medium">{listing.priceTo} DT</span>
                  </>
                )}
              </p>
            </div>
          )}

          {listing.promotions?.length > 0 && (
            <div className="mt-3 mb-3 flex items-center gap-2 text-sm">
              <IconTag className="h-4 w-4 shrink-0 text-rose-600" />
              <span className="font-medium text-gray-900 underline underline-offset-2">
                {listing.promotions.length} promotion{listing.promotions.length > 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-rose-600">
                {listing.promotions[0].type === 'percent'
                  ? `${Number(listing.promotions[0].value)}% réduction`
                  : `${Number(listing.promotions[0].value)} DT réduction`}
              </span>
            </div>
          )}

          {/* Capacite affichee avant les packs (l'adresse est deja indiquee
              sous le titre de la fiche, avec le lien Google Maps). */}
          {listing.capacity > 0 && (
            <div className="mb-4 mt-1 space-y-3">
              {listing.capacity > 0 && (
                <p className="flex items-center gap-3 text-sm text-gray-900">
                  <IconUsers className="h-5 w-5 shrink-0 text-gray-900" />
                  {listing.capacityMin > 0
                    ? `${listing.capacityMin} - ${listing.capacity} Invité(s)`
                    : `Jusqu'à ${listing.capacity} Invité(s)`}
                </p>
              )}
            </div>
          )}

          {listing.packages?.length > 0 ? (
            <div className="divide-y divide-gray-100 border-t border-gray-100 pt-3">
              {listing.packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <label
                    key={pkg.id}
                    className="flex cursor-pointer items-start gap-3 py-3 first:pt-0"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-900 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5">
                          <path
                            d="M3 8.5l3 3 7-7"
                            stroke="white"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                        className="sr-only"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="mt-0.5 text-xs text-gray-500">{pkg.description}</p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold text-gray-900">
                      {pkg.price ? `${pkg.price} DT` : 'Sur devis'}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            Number(listing.priceFrom) <= 0 && (
              <p className="text-2xl font-medium text-gray-900">Sur devis</p>
            )
          )}

          {/* Telephone du prestataire volontairement non affiche : modele lead
              (CLAUDE.md) - le client passe par la demande de devis, le
              prestataire le recontacte. */}

          {/* Site web / reseaux sociaux du prestataire volontairement non
              affiches (comme son telephone) : modele lead (CLAUDE.md) - le
              contact passe par la demande de devis. */}
        </aside>

        <div ref={contactFormRef} className="rounded-2xl border border-gray-100 px-7 py-5 shadow-xl shadow-gray-200/60">
          <ContactForm inline {...contactFormProps} />
        </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          {listing.amenities?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-900">Équipements :</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.amenities.map((item, index) => {
                  const Icon = AMENITY_ICON_MAP[item.icon] || DEFAULT_AMENITY_ICON;
                  return (
                    <span
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-6 text-base text-black shadow-sm"
                    >
                      <Icon className="h-6 w-6 text-gray-500" />
                      {item.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {(() => {
            // Le listing est toujours rattache a une sous-categorie
            // (CLAUDE.md) ; les services associes (liste informative FR/AR,
            // geree par l'admin) vivent sur la categorie principale (parent) -
            // voir listingController.respondWithListingDetail.
            const associatedServices = listing.category?.associatedServices?.length
              ? listing.category.associatedServices
              : listing.category?.parent?.associatedServices || [];

            return (
              associatedServices.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-gray-900">Services associés :</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {associatedServices.map((service) => (
                      <span
                        key={service.id}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-black"
                      >
                        {service.nameFr}
                        {service.nameAr && (
                          <span className="ml-2 text-gray-400" dir="rtl">
                            · {service.nameAr}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            );
          })()}

          <ProviderEventsSection events={events} onInterested={(event) => setInterestedEvent(event)} />

          <VehicleFleetSection
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onChooseVehicle={(vehicleId, decorationId) => {
              setSelectedVehicleId(vehicleId);
              setSelectedDecorationId(decorationId);
              setRentalModalOpen(true);
            }}
          />

          {rentalModalOpen && (
            <ContactForm
              listingId={listing.id}
              variant="transport"
              vehicles={vehicles}
              initialVehicleId={selectedVehicleId}
              initialDecorationId={selectedDecorationId}
              onClose={() => setRentalModalOpen(false)}
            />
          )}

          {/* Mobile/tablette (< lg) : le formulaire est loin sous la galerie
              et la description - barre fixe en bas d'ecran avec un bouton qui
              ouvre la demande en popup (meme formulaire, adapte au type de
              prestataire). Masquee a partir de lg, ou le formulaire est
              toujours visible dans la colonne de droite. */}
          <div className="fixed inset-x-0 bottom-0 z-[15] border-t border-gray-100 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
            {listing.fastResponseBadge && (
              <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-gray-600">
                <span aria-hidden="true" className="text-amber-500">
                  ⚡
                </span>
                Réponse en 24 heures
              </p>
            )}
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="w-full rounded-lg bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {REQUEST_BUTTON_LABELS[contactFormVariant] || REQUEST_BUTTON_LABELS.standard}
            </button>
          </div>

          {requestModalOpen && (
            <ContactForm {...contactFormProps} onClose={() => setRequestModalOpen(false)} />
          )}

          <ReviewsSection listing={listing} onReviewSubmitted={refreshListing} />

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900">Types d&apos;évènements :</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {ALL_EVENT_TYPES.map((eventType) => {
                const Icon = EVENT_TYPE_ICONS[eventType.icon];
                return (
                  <div
                    key={eventType.key}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border border-gray-200 px-3 py-4 text-center shadow-sm"
                  >
                    <Icon className="h-6 w-6 text-gray-800" />
                    <span className="text-sm font-medium text-gray-800">{eventType.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {interestedEvent && (
        <EventInterestForm
          listingId={listing.id}
          event={interestedEvent}
          onClose={() => setInterestedEvent(null)}
        />
      )}

      {showGallery && (
        <PhotoGalleryModal
          images={listing.images}
          title={listing.title}
          onClose={() => setShowGallery(false)}
        />
      )}

      {showVideoGallery && (
        <VideoGalleryModal
          videos={listing.videos}
          title={listing.title}
          onClose={() => setShowVideoGallery(false)}
        />
      )}

      {playingVideo && (
        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {similar.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">Prestataires similaires</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetail;
