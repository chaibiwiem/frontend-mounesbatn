// Outils partages pour les sejours "Maison d'hote" (Arrivee/Depart +
// chambres + invites) : demandes, reservations, clients et factures.

export const GUEST_RANGES = ['1-50', '50-100', '100-150', '150-200', '200-300', '300+'];

export const DEFAULT_ROOM = { adults: 2, children: 0, babies: 0 };

export const formatDateOnly = (value) =>
  value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR') : '—';

export const countNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return null;
  return Math.round(
    (new Date(`${checkOutDate}T00:00:00`) - new Date(`${checkInDate}T00:00:00`)) / 86400000
  );
};

// "2 chambres : 4 adultes, 1 enfant, 1 lit bébé" (totaux toutes chambres).
export const formatRoomsSummary = (rooms) => {
  if (!Array.isArray(rooms) || rooms.length === 0) return '—';
  const total = rooms.reduce(
    (acc, room) => ({
      adults: acc.adults + Number(room.adults || 0),
      children: acc.children + Number(room.children || 0),
      babies: acc.babies + Number(room.babies || 0),
    }),
    { adults: 0, children: 0, babies: 0 }
  );
  const parts = [`${total.adults} adulte${total.adults > 1 ? 's' : ''}`];
  if (total.children > 0) parts.push(`${total.children} enfant${total.children > 1 ? 's' : ''}`);
  if (total.babies > 0) parts.push(`${total.babies} lit${total.babies > 1 ? 's' : ''} bébé`);
  return `${rooms.length} chambre${rooms.length > 1 ? 's' : ''} : ${parts.join(', ')}`;
};

const round2 = (value) => Math.round(value * 100) / 100;

// Montant d'une reservation (toutes categories) : chambres (prix/nuit x
// nuits, sejour "Maison d'hote") + prix de la prestation + pack - remise
// (montant en DT ou pourcentage, plafonnee au sous-total). null si aucun prix
// n'est renseigne (montant saisi manuellement). Meme calcul que le backend
// (backend/src/utils/stay.js), qui recalcule a l'enregistrement.
export const computeBookingTotal = ({
  rooms,
  checkInDate,
  checkOutDate,
  servicePrice,
  packagePrice,
  discountType,
  discountValue,
}) => {
  const pricedRooms = Array.isArray(rooms) ? rooms : [];
  const nights = Math.max(0, countNights(checkInDate, checkOutDate) || 0);
  const perNight = round2(pricedRooms.reduce((sum, room) => sum + (Number(room?.price) || 0), 0));
  const roomsAmount = round2(perNight * nights);
  const serviceAmount = round2(Math.max(0, Number(servicePrice) || 0));
  const packAmount = round2(Math.max(0, Number(packagePrice) || 0));
  if (!(perNight > 0) && !(serviceAmount > 0) && !(packAmount > 0)) return null;
  const subtotal = round2(roomsAmount + serviceAmount + packAmount);
  const value = Math.max(0, Number(discountValue) || 0);
  const discountAmount = round2(
    Math.min(subtotal, discountType === 'percent' ? (subtotal * Math.min(value, 100)) / 100 : value)
  );
  return {
    nights,
    perNight,
    roomsAmount,
    serviceAmount,
    packAmount,
    subtotal,
    discountAmount,
    total: round2(subtotal - discountAmount),
  };
};

// "Séjour du 12/10/2026 au 15/10/2026 (3 nuits)"
export const formatStay = (checkInDate, checkOutDate) => {
  const nights = countNights(checkInDate, checkOutDate);
  if (nights === null) return '';
  return `Séjour du ${formatDateOnly(checkInDate)} au ${formatDateOnly(checkOutDate)} (${nights} nuit${
    nights > 1 ? 's' : ''
  })`;
};
