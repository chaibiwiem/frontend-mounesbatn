import { useEffect, useRef, useState } from 'react';
import ListingCard from './ListingCard';
import { IconChevronLeft, IconChevronRight } from './icons';

// Rangee de fiches prestataires defilable avec fleches, meme structure que
// CategoryCarousel (ref + ResizeObserver pour savoir si ca deborde) - affichee
// sous le bandeau de chaque categorie principale (PrestatairesLanding), avec
// ou sans sous-categories.
function ListingCarousel({ listings, hideContactButton = false, cardWidthClass = 'w-[260px]' }) {
  const scrollRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  // Fleches centrees sur la PHOTO des cartes (ratio 4/3 de la largeur de
  // carte, cf. ListingCard), pas sur la carte entiere (photo + texte) -
  // recalcule a chaque redimensionnement car la largeur de carte est
  // responsive.
  const [arrowTop, setArrowTop] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const checkOverflow = () => {
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      const cardWidth = el.firstElementChild?.offsetWidth;
      if (cardWidth) setArrowTop((cardWidth * 3) / 4 / 2);
    };
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [listings]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  if (!listings?.length) return null;

  return (
    // Mobile : marges laterales reservees aux fleches, pour qu'elles restent
    // a l'exterieur des cartes (jamais par-dessus la photo).
    <div className={`relative ${overflowing ? 'px-10 sm:px-0' : ''}`}>
      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
          style={arrowTop ? { top: arrowTop } : undefined}
          className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-1.5 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:p-2 sm:-translate-x-1/2"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex snap-x scroll-smooth gap-4 overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing) => (
          <div key={listing.id} className={`${cardWidthClass} shrink-0 snap-start`}>
            <ListingCard listing={listing} hideContactButton={hideContactButton} />
          </div>
        ))}
      </div>

      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Suivant"
          style={arrowTop ? { top: arrowTop } : undefined}
          className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-1.5 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:p-2 sm:translate-x-1/2"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default ListingCarousel;
