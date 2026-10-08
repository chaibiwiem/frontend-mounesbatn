function PhotoGalleryModal({ images, title, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-center border-b border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
          aria-label="Fermer"
        >
          ✕
        </button>
        <span className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700">
          Photos {images.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {images[0] && (
            <img
              src={images[0].url}
              alt={title}
              className="w-full rounded-xl object-cover"
            />
          )}
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {images.slice(1).map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoGalleryModal;
