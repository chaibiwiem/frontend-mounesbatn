import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings, cancelMyBooking, updateMyBookingDate } from '../services/bookingService';
import { getMyFavorites, removeFavorite } from '../services/favoriteService';
import { useAuth } from '../hooks/useAuth';
import { getListingUrl } from '../utils/listingUrl';
import ReviewForm from '../components/ReviewForm';
import ListingCard from '../components/ListingCard';
import ClientSettingsTab from '../components/client/ClientSettingsTab';
import ConfirmModal from '../components/provider/ConfirmModal';
import { IconCalendar, IconStar, IconHeart, IconMapPin, IconSettings } from '../components/icons';

// Modifiable par le client uniquement tant que la reservation n'est ni
// terminee ni deja annulee (meme regle cote backend, cf. bookingController
// cancelMyBooking/updateMyBookingDate).
const CLIENT_EDITABLE_STATUSES = ['pending', 'confirmed'];

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const TABS = [
  { key: 'bookings', label: 'Mes réservations', icon: IconCalendar },
  { key: 'favorites', label: 'Mes favoris', icon: IconHeart },
  { key: 'settings', label: 'Paramètres', icon: IconSettings },
];

function ClientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [editingDateBookingId, setEditingDateBookingId] = useState(null);
  const [dateDraft, setDateDraft] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [dateError, setDateError] = useState('');

  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const data = await getMyFavorites();
      setFavorites(data);
    } catch (err) {
      setFavoritesError(err.response?.data?.message || 'Impossible de charger vos favoris.');
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (listingId) => {
    setFavorites((prev) => prev.filter((listing) => listing.id !== listingId));
    try {
      await removeFavorite(listingId);
    } catch (err) {
      fetchFavorites();
    }
  };

  const startEditingDate = (e, booking) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDateBookingId(booking.id);
    setDateDraft(booking.eventDate || '');
    setDateError('');
  };

  const cancelEditingDate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDateBookingId(null);
    setDateError('');
  };

  const saveDate = async (e, bookingId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dateDraft) {
      setDateError('Choisissez une date.');
      return;
    }
    setSavingDate(true);
    setDateError('');
    try {
      await updateMyBookingDate(bookingId, dateDraft);
      setEditingDateBookingId(null);
      fetchBookings();
    } catch (err) {
      setDateError(err.response?.data?.message || 'Impossible de modifier la date.');
    } finally {
      setSavingDate(false);
    }
  };

  // Compteurs du bandeau (reservations totales, avis deja publies, favoris) -
  // simple lecture des listes deja chargees, pas d'appel API supplementaire.
  const reviewsCount = bookings.filter((b) => b.review).length;

  const stats = [
    { label: 'Réservations', value: bookings.length, icon: IconCalendar },
    { label: 'Avis publiés', value: reviewsCount, icon: IconStar },
    { label: 'Favoris', value: favorites.length, icon: IconHeart },
  ];

  return (
    <div className="min-h-[calc(100vh-57px)] bg-gray-50">
      <div className="border-b border-gray-100 bg-gradient-to-b from-rose-50 to-white">
        <div className="w-full !px-[50px] py-10">
          <h1
            className="text-3xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Bonjour, {user?.firstName || 'vous'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Suivez vos événements, laissez un avis et retrouvez vos prestataires favoris.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <stat.icon className="h-5 w-5 text-rose-500" />
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="w-full !px-[50px] py-8">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <IconCalendar className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucune réservation pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking, index) => (
                <Link
                  key={booking.id}
                  to={booking.listing ? getListingUrl(booking.listing) : '#'}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white px-6 py-[20px] shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
                >
                  {/* Coin accent purement decoratif + numero, meme design que
                      la reference fournie (carte "etape" numerotee avec
                      icone en cercle) - le statut, de longueur variable
                      ("En attente"...), est affiche a part en pastille pour
                      ne jamais deborder du coin. */}
                  <span
                    className="absolute right-0 top-0 h-14 w-14 bg-rose-500"
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                  />

                  <span
                    className="leading-none text-3xl font-bold text-gray-100"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="-mt-2 flex items-center justify-between">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-rose-200 text-rose-500">
                      <IconCalendar className="h-6 w-6" />
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  <p className="mt-4 font-semibold text-gray-900 group-hover:text-rose-600">
                    {booking.listing?.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    {booking.listing?.city && (
                      <>
                        <IconMapPin className="h-3.5 w-3.5" />
                        {booking.listing.city}
                      </>
                    )}
                    {booking.eventDate && <span className="ml-1">· {booking.eventDate}</span>}
                  </p>

                  {editingDateBookingId === booking.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="date"
                        value={dateDraft}
                        onChange={(e) => setDateDraft(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => saveDate(e, booking.id)}
                        disabled={savingDate}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        {savingDate ? '...' : 'OK'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingDate}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    CLIENT_EDITABLE_STATUSES.includes(booking.status) && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={(e) => startEditingDate(e, booking)}
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Modifier la date
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCancellingBooking(booking);
                          }}
                          className="font-semibold text-gray-500 hover:text-red-600 hover:underline"
                        >
                          Annuler la réservation
                        </button>
                      </div>
                    )
                  )}
                  {dateError && editingDateBookingId === booking.id && (
                    <p className="mt-1 text-xs text-red-600">{dateError}</p>
                  )}

                  {booking.status === 'completed' && (
                    <div className="mt-3">
                      {booking.review ? (
                        <div className="rounded-xl bg-gray-50 p-3 text-sm">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: booking.review.rating }).map((_, i) => (
                              <IconStar key={i} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </span>
                          {booking.review.title && (
                            <p className="mt-1 font-semibold text-gray-800">{booking.review.title}</p>
                          )}
                          {booking.review.comment && (
                            <p className="mt-1 line-clamp-2 text-gray-600">{booking.review.comment}</p>
                          )}
                          <span className="mt-1 inline-block text-xs font-medium text-green-600">
                            Avis publié
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setReviewingBooking(booking);
                          }}
                          className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                        >
                          Laisser un avis
                        </button>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'favorites' ? (
        <div className="w-full !px-[50px] py-8">
          {favoritesError && <p className="text-sm text-red-600">{favoritesError}</p>}

          {favoritesLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <IconHeart className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucun prestataire favori pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, isFavorited: true }}
                  onUnfavorite={() => handleUnfavorite(listing.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full !px-[50px] py-8">
          <ClientSettingsTab />
        </div>
      )}

      {reviewingBooking && (
        <ReviewForm
          bookingId={reviewingBooking.id}
          listing={reviewingBooking.listing}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            setReviewingBooking(null);
            fetchBookings();
          }}
        />
      )}

      {cancellingBooking && (
        <ConfirmModal
          title="Annuler cette réservation ?"
          description={
            cancellingBooking.listing?.title
              ? `Le prestataire (${cancellingBooking.listing.title}) sera informé de cette annulation.`
              : 'Le prestataire sera informé de cette annulation.'
          }
          confirmLabel="Annuler la réservation"
          onCancel={() => setCancellingBooking(null)}
          onConfirm={async () => {
            await cancelMyBooking(cancellingBooking.id);
            setCancellingBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}

export default ClientDashboard;
