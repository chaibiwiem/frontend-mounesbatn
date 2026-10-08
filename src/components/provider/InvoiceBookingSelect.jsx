import { formatDateOnly, formatStay, countNights } from '../../utils/stay';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

const isStay = (booking) => Boolean(booking.checkInDate && booking.checkOutDate);

const bookingLabel = (booking) => {
  const when = isStay(booking)
    ? formatStay(booking.checkInDate, booking.checkOutDate)
    : `Événement du ${formatDateOnly(booking.eventDate)}`;
  return booking.client?.name ? `${when} — ${booking.client.name}` : when;
};

// Description par defaut d'une facture liee a une reservation. Pour un sejour,
// le PDF imprime deja le detail (dates, chambres, invites) sous la ligne :
// la description reste courte pour ne pas le repeter.
export const bookingInvoiceDescription = (booking) => {
  if (!isStay(booking)) return `Prestation — événement du ${formatDateOnly(booking.eventDate)}`;
  const nights = countNights(booking.checkInDate, booking.checkOutDate);
  return `Hébergement (${nights} nuit${nights > 1 ? 's' : ''})`;
};

const sameId = (a, b) => String(a) === String(b);

// Reservation proposee automatiquement au choix d'un client : la plus recente
// (liste triee par date decroissante) non annulee et pas encore facturee,
// sinon la plus recente. null si le client n'a aucune reservation.
export const defaultBookingForClient = (bookings, clientId, invoicedBookingIds = []) => {
  const own = bookings.filter((b) => b.status !== 'cancelled' && sameId(b.clientId, clientId));
  return own.find((b) => !invoicedBookingIds.some((id) => sameId(id, b.id))) || own[0] || null;
};

// Applique une reservation (ou aucune) au formulaire de facture : client,
// description et montant suivent la reservation, sauf s'ils ont ete modifies
// a la main (valeurs differentes de celles de la reservation precedente).
export const applyBookingToInvoiceForm = (prev, booking, bookings) => {
  const previous = bookings.find((b) => sameId(b.id, prev.bookingId));
  const descriptionIsAuto =
    !prev.description || Boolean(previous && prev.description === bookingInvoiceDescription(previous));
  const amountIsAuto =
    prev.amount === '' || prev.amount == null || Boolean(previous && Number(prev.amount) === Number(previous.totalPrice));
  // Acompte : repris de l'acompte declare sur la reservation, meme regle
  // "auto tant que non modifie a la main" que le montant.
  const depositIsAuto =
    prev.deposit === '' ||
    prev.deposit == null ||
    Boolean(previous && Number(prev.deposit) === Number(previous.deposit || 0));
  return {
    ...prev,
    bookingId: booking ? booking.id : '',
    clientId: booking?.clientId || prev.clientId,
    description: descriptionIsAuto ? (booking ? bookingInvoiceDescription(booking) : '') : prev.description,
    amount: amountIsAuto ? (booking?.totalPrice != null ? String(booking.totalPrice) : '') : prev.amount,
    deposit: depositIsAuto ? (booking?.deposit ? String(booking.deposit) : '') : prev.deposit,
  };
};

// Selection (facultative) de la reservation facturee, limitee aux
// reservations du client choisi quand il y en a un.
function InvoiceBookingSelect({ bookings, clientId, value, onChange }) {
  const options = bookings.filter(
    (booking) =>
      booking.status !== 'cancelled' &&
      (!clientId || String(booking.clientId) === String(clientId) || String(booking.id) === String(value))
  );

  return (
    <div>
      <label className={labelClass}>Réservation (facultatif)</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(bookings.find((b) => String(b.id) === e.target.value) || null)}
        className={inputClass}
      >
        <option value="">Aucune réservation liée</option>
        {options.map((booking) => (
          <option key={booking.id} value={booking.id}>
            {bookingLabel(booking)}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        {clientId && options.length === 0
          ? 'Aucune réservation enregistrée pour ce client.'
          : "Sélectionnée automatiquement au choix du client. Pré-remplit la description, le montant et l'acompte ; le séjour figure sur le PDF."}
      </p>
    </div>
  );
}

export default InvoiceBookingSelect;
