function VideoPlayerModal({ video, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-white hover:text-gray-300"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          {video.type === 'upload' ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={video.url} controls autoPlay className="h-full w-full" />
          ) : (
            <iframe
              src={`${video.embedUrl}?autoplay=1`}
              title={video.title || `Vidéo ${video.id}`}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
        </div>
        {video.title && <p className="mt-3 text-center text-sm text-gray-300">{video.title}</p>}
      </div>
    </div>
  );
}

export default VideoPlayerModal;
