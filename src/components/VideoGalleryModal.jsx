import { useState } from 'react';
import { IconPlay } from './icons';

function VideoTile({ video, playing, onPlay, large }) {
  return (
    <div className={`aspect-video w-full overflow-hidden rounded-xl bg-black ${large ? '' : ''}`}>
      {playing ? (
        video.type === 'upload' ? (
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
        )
      ) : (
        <button type="button" onClick={onPlay} className="group relative block h-full w-full">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-800 to-black" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow">
              <IconPlay className="ml-1 h-6 w-6" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function VideoGalleryModal({ videos, onClose }) {
  const [playingId, setPlayingId] = useState(null);

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
          Vidéos {videos.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-3">
          {videos.map((video, index) => (
            <VideoTile
              key={video.id}
              video={video}
              large={index === 0}
              playing={playingId === video.id}
              onPlay={() => setPlayingId(video.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoGalleryModal;
