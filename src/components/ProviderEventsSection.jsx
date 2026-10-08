import { IconCalendar, IconClock, IconMapPin } from './icons';

const TYPE_LABELS = {
  portes_ouvertes: 'Journée portes ouvertes',
  show_cooking: 'Show cooking',
  defile: 'Défilé de mode',
  lancement: 'Lancement',
  degustation: 'Dégustation',
  autre: 'Autre',
};

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTimeRange = (event) => {
  const start = event.startTime?.slice(0, 5);
  const end = event.endTime?.slice(0, 5);
  if (start && end) return `${start} - ${end}`;
  if (start) return `À partir de ${start}`;
  return null;
};

// Fiche publique (M3) : evenements organises PAR le prestataire, publies et
// a venir uniquement (voir providerEventController.getPublicListingEvents).
// Le bouton "Je suis interesse(e)" ouvre le formulaire de demande de devis
// existant (M4), pre-rempli avec le titre de l'evenement.
function ProviderEventsSection({ events, onInterested }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#2C3E50]">Événements à venir</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="overflow-hidden rounded-xl border border-[#E8EEF3] bg-white shadow-sm transition hover:border-[#4E8BC4]"
          >
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-[#FFF5F8] text-[#FF99BE]">
                <IconCalendar className="h-10 w-10" />
              </div>
            )}

            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4E8BC4]">
                {TYPE_LABELS[event.type]}
              </p>
              <h3 className="mt-1 font-semibold text-[#2C3E50]">{event.title}</h3>

              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-1.5">
                  <IconCalendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {formatDate(event.eventDate)}
                </p>
                {formatTimeRange(event) && (
                  <p className="flex items-center gap-1.5">
                    <IconClock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {formatTimeRange(event)}
                  </p>
                )}
                {event.location && (
                  <p className="flex items-center gap-1.5">
                    <IconMapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {event.location}
                  </p>
                )}
              </div>

              {event.description && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-500">{event.description}</p>
              )}

              <button
                type="button"
                onClick={() => onInterested(event)}
                className="mt-3 w-full rounded-lg bg-[#4E8BC4] py-2 text-xs font-semibold text-white transition hover:bg-[#3f74a3]"
              >
                Je suis intéressé(e)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProviderEventsSection;
