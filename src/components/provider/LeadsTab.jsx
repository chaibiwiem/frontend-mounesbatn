import { useCallback, useEffect, useState } from 'react';
import { getListingLeads, updateLeadStatus, exportListingLeads } from '../../services/leadService';
import { createBooking } from '../../services/bookingService';
import { createVehicleBooking } from '../../services/vehicleService';
import { estimateRentalPrice, hasPositivePrice } from '../../utils/rentalPricing';
import BookingFormModal from './BookingFormModal';
import ConfirmLeadModal from './ConfirmLeadModal';
import { FEE_STATUS_LABELS, FEE_STATUS_COLORS } from '../../services/connectionFeeService';
import { formatDateOnly, countNights, formatRoomsSummary } from '../../utils/stay';
import useMyPackages from '../../hooks/useMyPackages';
import { formatPackage } from '../../utils/packages';
import {
  IconInbox,
  IconPercent,
  IconClipboardCheck,
  IconDownload,
  IconCheckCircle,
  IconX,
} from '../icons';

// Regroupement en 4 categories affichees au prestataire (le statut reel en
// base reste new/answered/late/converted/lost - voir CLAUDE.md/Lead.js) :
// new + late = pas encore traitee, answered = traitee, converted = confirmee,
// lost = refusee.
const STATUS_LABELS = {
  new: 'En attente',
  late: 'En attente',
  answered: 'Traitées',
  converted: 'Confirmées',
  lost: 'Refusées',
};

const STATUS_COLORS = {
  new: 'bg-amber-100 text-amber-700',
  late: 'bg-amber-100 text-amber-700',
  answered: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-rose-100 text-rose-700',
};

const VEHICLE_TYPE_LABELS = { voiture: 'Voiture', bus: 'Bus', minibus: 'Minibus' };

// Un lead "location" (prestataires Transport) se reconnait a la presence de
// departureDatetime - meme marqueur que dans emailService.sendNewLeadEmail.
const isTransportLead = (lead) => Boolean(lead.departureDatetime);
// Un lead "commande produit" (prestataires Parfums & Soins) se reconnait a
// la presence d'un des champs produit - meme marqueur que dans
// emailService.sendNewLeadEmail.
const isProductLead = (lead) => Boolean(lead.quantity || lead.deliveryDate || lead.deliveryMode);
// Un lead "sejour" (prestataires Maison d'hote) se reconnait a la presence de
// checkInDate - meme marqueur que dans emailService.sendNewLeadEmail.
const isAccommodationLead = (lead) => Boolean(lead.checkInDate);


const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const estimatedAmount = (lead) => {
  const estimate = estimateRentalPrice(
    lead.departureDatetime,
    lead.returnDatetime,
    lead.vehicle,
    lead.decoration,
    lead.selectedOptions
  );
  return estimate ? estimate.amount : null;
};

const formatSelectedOptions = (lead) =>
  (lead.selectedOptions || [])
    .map((selected) => `${selected.option?.name}${selected.quantity > 1 ? ` x${selected.quantity}` : ''}`)
    .join(', ');

function LeadsTab({ listingId, onLeadsChange, onConnectionFeesChange, isAccommodationProvider = false }) {
  const packages = useMyPackages();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [bookingLead, setBookingLead] = useState(null);
  // Frais de mise en relation (M13) : categorie concernee + demande a
  // confirmer (formulaire ouvert apres une reservation, ou a la demande).
  const [connectionFee, setConnectionFee] = useState({ concerned: false });
  const [confirmingLead, setConfirmingLead] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListingLeads(listingId);
      setLeads(data.leads);
      setStats(data.stats);
      setConnectionFee(data.connectionFee || { concerned: false });
      onLeadsChange?.();
      return data.leads;
    } catch (err) {
      setError(
        err.response?.data?.message || 'Impossible de charger vos demandes pour le moment.'
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId, status) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, status);
      await fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour ce statut.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateBookingFromLead = async (payload) => {
    // Demande de location Transport avec vehicule choisi : enregistree comme
    // VehicleBooking (periode depart/retour, anti-chevauchement pour les
    // futures demandes) plutot que Booking generique - voir BookingFormModal,
    // qui inclut vehicleId dans le payload uniquement dans ce cas.
    if (payload.vehicleId) {
      const { vehicleId, ...rest } = payload;
      await createVehicleBooking(vehicleId, rest);
    } else {
      await createBooking(payload);
    }
    const lead = bookingLead;
    setBookingLead(null);
    const freshLeads = await fetchLeads();
    onConnectionFeesChange?.();
    // Categorie concernee : les frais sont normalement declares
    // automatiquement par le serveur. Formulaire manuel uniquement s'ils n'ont
    // pas pu l'etre (pourcentage sans montant, conditions non acceptees).
    const fresh = freshLeads?.find((item) => item.id === lead.id);
    if (connectionFee.concerned && fresh && !fresh.commission) setConfirmingLead(fresh);
  };

  const canConfirm = (lead) => connectionFee.concerned && !lead.commission && lead.status !== 'lost';

  // Toutes les demandes d'une meme fiche partagent la meme categorie : soit
  // toutes des demandes de location (Transport), soit toutes des commandes
  // produit (Parfums & Soins), soit toutes des demandes d'evenement standard
  // - jamais un melange entre elles pour un seul listingId.
  const hasTransportLeads = leads.some(isTransportLead);
  const hasProductLeads = leads.some(isProductLead);
  const hasAccommodationLeads = leads.some(isAccommodationLead);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportListingLeads(listingId);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'exporter les demandes.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Mes demandes de devis</h2>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || leads.length === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <IconDownload className="h-4 w-4" />
          {exporting ? 'Export en cours...' : 'Exporter vers Excel'}
        </button>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <IconInbox className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Total des demandes</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <IconPercent className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Taux de réponse (24h)</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.responseRate === null ? '—' : `${stats.responseRate}%`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                stats.fastResponseBadge ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <IconClipboardCheck className="h-5 w-5" />
            </span>
            {stats.fastResponseBadge ? (
              <span className="text-sm font-medium text-green-600">Badge « Réponse en 24h »</span>
            ) : (
              <span className="text-sm font-medium text-gray-400">Badge « Réponse en 24h » retiré</span>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <IconPercent className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Taux de conversion</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.conversionRate === null || stats.conversionRate === undefined ? '—' : `${stats.conversionRate}%`}
              </p>
              {connectionFee.concerned && (
                <p className="text-[11px] text-gray-400">Demandes confirmées et validées par Mounesba</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-8 text-center text-sm text-gray-500">Chargement...</p>
      ) : leads.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500">Aucune demande reçue pour le moment.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table
            className="w-full divide-y divide-gray-100 text-sm"
            style={{
              // Largeur minimale selon les colonnes affichees (+ colonne frais
              // de mise en relation pour une categorie concernee).
              minWidth:
                (hasTransportLeads ? 2100 : hasProductLeads ? 1500 : hasAccommodationLeads ? 1400 : 1180) +
                (connectionFee.concerned ? 220 : 0),
            }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                {hasTransportLeads ? (
                  <>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Départ</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Retour</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Passagers</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Véhicule</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Chauffeur</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Décoration
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Options</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Prise en charge
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Montant estimé
                    </th>
                  </>
                ) : hasProductLeads ? (
                  <>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Produit</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Quantité</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Livraison souhaitée
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Mode</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Adresse de livraison
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Personnalisation
                    </th>
                  </>
                ) : hasAccommodationLeads ? (
                  <>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Arrivée</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Départ</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nuits</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                      Chambres et occupation
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Invités</th>
                  </>
                ) : (
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    Date / Événement
                  </th>
                )}
                {/* Pack coche par le client (produit : deja dans la colonne "Produit"). */}
                {!hasProductLeads && <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Pack choisi</th>}
                {connectionFee.concerned && (
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    Frais de mise en relation
                  </th>
                )}
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.email || '—'}</td>
                  {hasTransportLeads ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateTime(lead.departureDatetime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateTime(lead.returnDatetime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.passengers || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {lead.vehicle
                          ? [lead.vehicle.brand, lead.vehicle.model].filter(Boolean).join(' ') ||
                            VEHICLE_TYPE_LABELS[lead.vehicle.type]
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {lead.withDriver === null
                          ? 'Peu importe'
                          : lead.withDriver
                            ? 'Avec chauffeur'
                            : 'Sans chauffeur'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {lead.decoration
                          ? `${lead.decoration.name}${
                              hasPositivePrice(lead.decoration.price) ? ` (${lead.decoration.price} DT)` : ''
                            }`
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatSelectedOptions(lead) || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.pickupLocation || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {estimatedAmount(lead) !== null ? `${estimatedAmount(lead)} DT` : '—'}
                      </td>
                    </>
                  ) : hasProductLeads ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {lead.package ? lead.package.name : 'Autre / à définir'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.quantity || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.deliveryDate || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {lead.deliveryMode === 'livraison'
                          ? 'Livraison'
                          : lead.deliveryMode === 'retrait'
                            ? 'Retrait'
                            : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.deliveryAddress || '—'}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-gray-700" title={lead.customization || ''}>
                        {lead.customization || '—'}
                      </td>
                    </>
                  ) : hasAccommodationLeads ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(lead.checkInDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateOnly(lead.checkOutDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{countNights(lead.checkInDate, lead.checkOutDate) ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatRoomsSummary(lead.rooms)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{lead.guests || '—'}</td>
                    </>
                  ) : (
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {lead.eventDate || '—'}
                      {lead.dateFlexible && ' (flexible)'}
                      {lead.guests && ` · ${lead.guests}`}
                    </td>
                  )}
                  {!hasProductLeads && (
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatPackage(lead.package)}</td>
                  )}
                  {connectionFee.concerned && (
                    <td className="whitespace-nowrap px-4 py-3">
                      {lead.commission ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${FEE_STATUS_COLORS[lead.commission.status]}`}
                        >
                          {FEE_STATUS_LABELS[lead.commission.status]}
                        </span>
                      ) : canConfirm(lead) ? (
                        <button
                          type="button"
                          onClick={() => setConfirmingLead(lead)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Confirmer la demande aboutie
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {['new', 'late', 'answered'].includes(lead.status) ? (
                      <div className="flex items-center justify-end gap-1">
                        {lead.status !== 'answered' && (
                          <button
                            type="button"
                            disabled={updatingId === lead.id}
                            onClick={() => handleStatusChange(lead.id, 'answered')}
                            title="Marquer traitée"
                            aria-label="Marquer traitée"
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                          >
                            <IconCheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === lead.id}
                          onClick={() => setBookingLead(lead)}
                          title="Enregistrer une réservation"
                          aria-label="Enregistrer une réservation"
                          className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                        >
                          <IconClipboardCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === lead.id}
                          onClick={() => handleStatusChange(lead.id, 'lost')}
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
      )}

      {bookingLead && (
        <BookingFormModal
          lead={bookingLead}
          isAccommodation={isAccommodationProvider}
          packages={packages}
          connectionFee={connectionFee}
          onSave={handleCreateBookingFromLead}
          onCancel={() => setBookingLead(null)}
        />
      )}

      {confirmingLead && (
        <ConfirmLeadModal
          lead={confirmingLead}
          connectionFee={connectionFee}
          onCancel={() => setConfirmingLead(null)}
          onConfirmed={async () => {
            setConfirmingLead(null);
            onConnectionFeesChange?.();
            await fetchLeads();
          }}
        />
      )}
    </div>
  );
}

export default LeadsTab;
