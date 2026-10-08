import { useEffect, useRef, useState } from 'react';
import { CategoryIcon } from '../utils/categoryIcons';
import { IconChevronLeft, IconChevronRight } from './icons';

// Rangee de tuiles circulaires (categories/sous-categories) avec fleches de
// defilement - reutilisee par la page d'accueil (categories principales) et
// la page de destination d'une categorie (ses sous-categories). Centree
// quand les tuiles tiennent dans la largeur disponible (comme la reference),
// sinon defilable avec fleches.
function CategoryCarousel({ categories, onSelect }) {
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
  }, [categories]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  if (!categories?.length) return null;

  return (
    <div className="relative">
      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
          className="absolute left-0 top-[48px] z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:top-[70px] sm:h-10 sm:w-10 lg:top-[85px]"
        >
          <IconChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className={`flex snap-x scroll-smooth gap-3 overflow-x-auto px-2 pb-1 sm:gap-6 lg:gap-8 [&::-webkit-scrollbar]:hidden ${
          overflowing ? '' : 'justify-center'
        }`}
      >
        {categories.map((cat) => {
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat)}
              className="group flex shrink-0 snap-start flex-col items-center gap-3"
            >
              <span className="flex h-[95px] w-[95px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-100 to-rose-200 shadow-sm ring-1 ring-rose-100 transition duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:ring-rose-300 sm:h-[140px] sm:w-[140px] lg:h-[170px] lg:w-[170px]">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                ) : (
                  <CategoryIcon
                    category={cat}
                    className="h-7 w-7 text-rose-600 transition group-hover:text-rose-700 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
                  />
                )}
              </span>
              <span className="max-w-[6rem] text-center text-xs text-gray-800 sm:max-w-[9rem] sm:text-sm" style={{ fontWeight: 400 }}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Suivant"
          className="absolute right-0 top-[48px] z-10 flex h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:top-[70px] sm:h-10 sm:w-10 lg:top-[85px]"
        >
          <IconChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
}

export default CategoryCarousel;
