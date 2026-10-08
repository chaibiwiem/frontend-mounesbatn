import { IconPlay } from './icons';

function VideoThumbnailCard({ video, onPlay }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-gray-900"
    >
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-gray-800 to-black" />
      )}
      <span className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
      <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow transition group-hover:bg-white">
        <IconPlay className="ml-0.5 h-4 w-4" />
      </span>
      {video.title && (
        <span className="absolute bottom-3 right-3 max-w-[60%] truncate rounded-full bg-black/50 px-2 py-1 text-xs text-white">
          {video.title}
        </span>
      )}
    </button>
  );
}

export default VideoThumbnailCard;
