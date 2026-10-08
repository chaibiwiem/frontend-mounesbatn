import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getListingEvents,
  getListingEventLeads,
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
} from '../../services/providerEventService';
import { updateLeadStatus } from '../../services/leadService';
import EventFormModal from './EventFormModal';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconClock,
  IconConfetti,
  IconCheckCircle,
  IconX,
} from '../icons';

const TYPE_LABELS = {
  portes_ouvertes: 'Journée portes ouvertes',
  show_cooking: 'Show cooking',
  defile: 'Défilé de mode',
  lancement: 'Lancement',
  degustation: 'Dégustation',
  autre: 'Autre',
};

// Meme statuts que "Demandes de devis" (Lead.status, voir CLAUDE.md) - regroupes
// en 3 categories affichees ici.
const REQUEST_STATUS_LABELS = {
  new: 'En attente',
  late: 'En attente',
  answered: 'Traitée',
  converted: 'Traitée',
  lost: 'Refusée',
};

const REQUEST_STATUS_COLORS = {
  new: 'bg-amber-100 text-amber-700',
  late: 'bg-amber-100 text-amber-700',
  answered: 'bg-[#4E8BC4]/10 text-[#4E8BC4]',
  converted: 'bg-[#4E8BC4]/10 text-[#4E8BC4]',
  lost: 'bg-rose-100 text-rose-700',
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

// "Mes evenements" (M5) : espace prestataire, disponible selon le plan
// souscrit (`eventsEnabled`, Parametres admin > Plans & Tarifs - desactive
// pour Starter). L'onglet est masque cote dashboard quand indisponible, voir
// ProviderDashboard.jsx. Evenements organises PAR le prestataire (a ne pas
// confondre avec les "types d'evenements" du client, purement editoriaux -
// voir M3).
function EventsTab({ listingId, listingAddress, onLeadsChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Demandes d'interet ("Je suis interesse(e)") sur un evenement publie -
  // liste dediee, separee de "Demandes de devis" (voir leadController.getListingEventLeads).
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListingEvents(listingId);
      setEvents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos événements.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await getListingEventLeads(listingId);
      setRequests(data.leads);
      onLeadsChange?.();
    } catch (err) {
      setRequestsError(err.response?.data?.message || 'Impossible de charger les demandes.');
    } finally {
      setLoadingRequests(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchEvents();
    fetchRequests();
  }, [fetchEvents, fetchRequests]);

  const handleRequestStatusChange = async (leadId, status) => {
    setUpdatingRequestId(leadId);
    try {
      await updateLeadStatus(leadId, status);
      await fetchRequests();
    } catch (err) {
      setRequestsError(err.response?.data?.message || 'Impossible de mettre à jour ce statut.');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...events].sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1));
    return {
      upcoming: sorted.filter((e) => e.eventDate >= today),
      past: sorted.filter((e) => e.eventDate < today).reverse(),
    };
  }, [events]);

  const visibleEvents = tab === 'upcoming' ? upcoming : past;

  const handleSave = async (payload) => {
    if (editingEvent) {
      const updated = await updateEvent(editingEvent.id, payload);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const created = await createEvent(listingId, payload);
      setEvents((prev) => [...prev, created]);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleTogglePublish = async (event) => {
    setBusyId(event.id);
    try {
      const updated = await publishEvent(event.id, !event.isPublished);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour cet événement.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event) => {
    setBusyId(event.id);
    try {
      await deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer cet événement.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#2C3E50]">Mes événements</h2>
        <button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#4E8BC4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3f74a3]"
        >
          <IconPlus className="h-4 w-4" />
          Créer un événement
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Montrez vos services en action, créez de la confiance et attirez de nouvelles demandes.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm font-semibold w-fit">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`rounded-md px-4 py-1.5 transition ${
            tab === 'upcoming' ? 'bg-white text-[#2C3E50] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          À venir {upcoming.length > 0 && `(${upcoming.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('past')}
          className={`rounded-md px-4 py-1.5 transition ${
            tab === 'past' ? 'bg-white text-[#2C3E50] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Passés {past.length > 0 && `(${past.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`rounded-md px-4 py-1.5 transition ${
            tab === 'requests' ? 'bg-white text-[#2C3E50] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Demandes {requests.length > 0 && `(${requests.length})`}
        </button>
      </div>

      {tab === 'requests' ? (
        requestsError ? (
          <p className="mt-4 text-sm text-red-600">{requestsError}</p>
        ) : loadingRequests ? (
          <p className="mt-6 text-sm text-gray-500">Chargement...</p>
        ) : requests.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#E8EEF3] bg-white px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC2D9]">
              <IconConfetti className="h-8 w-8 text-white" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#2C3E50]">Aucune demande pour le moment</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Les personnes intéressées par un de vos événements publiés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#E8EEF3] bg-white shadow-sm">
            <table className="w-full min-w-[900px] divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Événement</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Message</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.phone || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.email || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      <span className="rounded-full bg-[#4E8BC4]/10 px-2.5 py-1 text-xs font-semibold text-[#4E8BC4]">
                        {lead.interestedEvent?.title || '—'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-700" title={lead.message || ''}>
                      {lead.message || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${REQUEST_STATUS_COLORS[lead.status]}`}
                      >
                        {REQUEST_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {['new', 'late', 'answered'].includes(lead.status) ? (
                        <div className="flex items-center justify-end gap-1">
                          {lead.status !== 'answered' && (
                            <button
                              type="button"
                              disabled={updatingRequestId === lead.id}
                              onClick={() => handleRequestStatusChange(lead.id, 'answered')}
                              title="Marquer traitée"
                              aria-label="Marquer traitée"
                              className="rounded-lg p-2 text-gray-500 hover:bg-[#4E8BC4]/10 hover:text-[#4E8BC4] disabled:opacity-50"
                            >
                              <IconCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={updatingRequestId === lead.id}
                            onClick={() => handleRequestStatusChange(lead.id, 'lost')}
                            title="Marquer refusée"
                            aria-label="Marquer refusée"
                            className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <IconX className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : events.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#E8EEF3] bg-white px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC2D9]">
            <IconConfetti className="h-8 w-8 text-white" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-[#2C3E50]">Montrez vos services en action</h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Publiez vos journées portes ouvertes, show cookings, défilés ou lancements pour créer de la
            confiance auprès de vos futurs clients et attirer de nouvelles demandes.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setShowForm(true);
            }}
            className="mt-5 flex items-center gap-2 rounded-lg bg-[#4E8BC4] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f74a3]"
          >
            <IconPlus className="h-4 w-4" />
            Créer un événement
          </button>
        </div>
      ) : visibleEvents.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500">
          {tab === 'upcoming' ? 'Aucun événement à venir.' : 'Aucun événement passé.'}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-xl border border-[#E8EEF3] bg-white shadow-sm transition hover:border-[#4E8BC4]"
            >
              {event.imageUrl ? (
                <img src={event.imageUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-[#FFF5F8] text-[#FF99BE]">
                  <IconCalendar className="h-9 w-9" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#2C3E50]">{event.title}</h3>
                    <p className="text-xs text-gray-500">{TYPE_LABELS[event.type]}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                      event.isPublished ? 'bg-[#4E8BC4]' : 'bg-[#8A9BA8]'
                    }`}
                  >
                    {event.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600">
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
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={busyId === event.id}
                    onClick={() => handleTogglePublish(event)}
                    className="text-xs font-semibold text-[#4E8BC4] hover:underline disabled:opacity-50"
                  >
                    {event.isPublished ? 'Dépublier' : 'Publier'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(event);
                        setShowForm(true);
                      }}
                      title="Modifier"
                      aria-label="Modifier"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#4E8BC4]"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === event.id}
                      onClick={() => handleDelete(event)}
                      title="Supprimer"
                      aria-label="Supprimer"
                      className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventFormModal
          event={editingEvent}
          defaultLocation={listingAddress}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

export default EventsTab;
