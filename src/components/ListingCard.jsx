import { useState } from 'react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import ContactForm from './ContactForm';
import { IconUsers, IconTag, IconImage } from './icons';
import { getListingUrl } from '../utils/listingUrl';

function ListingCard({ listing, onUnfavorite, hideContactButton = false }) {
  const images = listing.images?.length > 0 ? listing.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const hasPromo = listing.promotions && listing.promotions.length > 0;
  const activeImage = images[activeIndex];

  const handleDotClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex(index);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContactForm(true);
  };

  return (
    <>
      <Link
        to={getListingUrl(listing)}
        className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-rose-200">
            <IconImage className="h-10 w-10 text-rose-400" />
          </div>
        )}

        {hasPromo && (
          <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            Promo
          </span>
        )}

        <FavoriteButton
          listingId={listing.id}
          initialFavorited={Boolean(listing.isFavorited)}
          className="absolute right-2 top-2 h-8 w-8"
          onChange={(nextState) => {
            if (!nextState) onUnfavorite?.();
          }}
        />

        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={(e) => handleDotClick(e, index)}
                aria-label={`Photo ${index + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  index === activeIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">{listing.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
          <span className="text-amber-500">★</span>
          {listing.ratingCount > 0 ? (
            <>
              {Number(listing.ratingAvg).toFixed(1)}
              <span className="text-gray-400">({listing.ratingCount})</span>
            </>
          ) : (
            <span className="text-gray-400">Nouveau</span>
          )}
          <span className="text-gray-300">·</span>
          <span className="truncate">{listing.city}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <IconTag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {Number(listing.priceFrom) > 0 ? (
              <>
                À partir de <span className="font-bold text-gray-900">{listing.priceFrom} DT</span>
              </>
            ) : (
              'Sur devis'
            )}
          </span>
          {listing.capacity > 0 && (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <IconUsers className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {listing.capacity}
            </span>
          )}
        </div>

        {!hideContactButton && (
          <button
            type="button"
            onClick={handleContactClick}
            className="mt-3 w-full rounded-lg border border-rose-200 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Nous contacter
          </button>
        )}
      </div>
      </Link>

      {showContactForm && (
        <ContactForm listingId={listing.id} onClose={() => setShowContactForm(false)} />
      )}
    </>
  );
}

export default ListingCard;
