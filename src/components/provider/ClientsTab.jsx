import { useCallback, useEffect, useState } from 'react';
import {
  getClients,
  getClient,
  updateClient,
  clearManualTag,
  deleteClient,
  exportClientsCsv,
} from '../../services/clientService';
import ConfirmModal from '../admin/ConfirmModal';
import { IconEye, IconEdit, IconTrash } from '../icons';
import { formatDateOnly, formatStay, formatRoomsSummary } from '../../utils/stay';

const TAG_LABELS = { nouveau: 'Nouveau', recurrent: 'Récurrent', vip: 'VIP' };
const TAG_COLORS = {
  nouveau: 'bg-blue-100 text-blue-700',
  recurrent: 'bg-amber-100 text-amber-700',
  vip: 'bg-rose-100 text-rose-700',
};

const BOOKING_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

function ClientEditModal({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    totalAmount: client.totalAmount,
    depositAmount: client.depositAmount,
    tag: client.tag,
    notes: client.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { notes: form.notes, totalAmount: form.totalAmount, depositAmount: form.depositAmount };
      if (form.tag !== client.tag) payload.tag = form.tag;
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de sauvegarder ce client.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier le client</h3>
        <p className="mt-1 text-sm text-gray-500">{client.name}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Acompte (DT)</label>
              <input
                type="number"
                value={form.depositAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, depositAmount: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tag (surcharge manuelle)</label>
            <select
              value={form.tag}
              onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
              className={inputClass}
            >
              {Object.entries(TAG_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">
            Le montant total et l'acompte sont recalculés automatiquement à partir de vos
            réservations non annulées pour ce client ; une correction manuelle ici sera écrasée
            par la prochaine réservation créée ou modifiée.
          </p>
          <div>
            <label className={labelClass}>Notes privées</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientViewModal({ client, onClose }) {
  // Historique des reservations du client (sejours inclus pour les maisons d'hote).
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    let active = true;
    getClient(client.id)
      .then((data) => active && setBookings(data.bookings || []))
      .catch(() => active && setBookings([]));
    return () => {
      active = false;
    };
  }, [client.id]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {client.email || '—'} · {client.phone || '—'}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TAG_COLORS[client.tag]}`}>
            {TAG_LABELS[client.tag]}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Événements</p>
            <p className="text-lg font-bold text-gray-900">{client.eventsCount}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Montant total déclaré</p>
            <p className="text-lg font-bold text-gray-900">{client.totalAmount} DT</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Acompte déclaré</p>
            <p className="text-lg font-bold text-gray-900">{client.depositAmount} DT</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-700">Notes privées</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
            {client.notes || 'Aucune note.'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-700">Réservations</p>
          {bookings === null ? (
            <p className="mt-1 text-sm text-gray-400">Chargement…</p>
          ) : bookings.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">Aucune réservation.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {bookings.map((booking) => (
                <li key={booking.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">
                      {booking.checkInDate && booking.checkOutDate
                        ? formatStay(booking.checkInDate, booking.checkOutDate)
                        : formatDateOnly(booking.eventDate)}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>
                  {Array.isArray(booking.rooms) && booking.rooms.length > 0 && (
                    <p className="mt-1 text-xs text-gray-600">{formatRoomsSummary(booking.rooms)}</p>
                  )}
                  {booking.guests && <p className="mt-0.5 text-xs text-gray-600">Invités : {booking.guests}</p>}
                  {booking.totalPrice != null && (
                    <p className="mt-0.5 text-xs text-gray-600">Montant déclaré : {booking.totalPrice} DT</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [viewingClient, setViewingClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (tagFilter) params.tag = tagFilter;
      const data = await getClients(params);
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos clients.');
    } finally {
      setLoading(false);
    }
  }, [search, tagFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchClients, 300);
    return () => clearTimeout(timeout);
  }, [fetchClients]);

  const handleSave = async (payload) => {
    await updateClient(editingClient.id, payload);
    setEditingClient(null);
    await fetchClients();
  };

  const handleClearManualTag = async (client) => {
    try {
      await clearManualTag(client.id);
      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de lever la surcharge du tag.');
    }
  };

  const handleConfirmDelete = async () => {
    await deleteClient(deletingClient.id);
    setDeletingClient(null);
    await fetchClients();
  };

  const handleExport = async () => {
    try {
      const blob = await exportClientsCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clients.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'exporter les clients.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Mes clients (CRM)</h2>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Exporter en CSV
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, téléphone)..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les tags</option>
          {Object.entries(TAG_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : clients.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">Aucun client pour le moment.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1040px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Événements</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Montant total</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Acompte</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Tag</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{client.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{client.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{client.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{client.eventsCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{client.totalAmount} DT</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{client.depositAmount} DT</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${TAG_COLORS[client.tag]}`}
                      >
                        {TAG_LABELS[client.tag]}
                      </span>
                      {client.tagManual && (
                        <button
                          type="button"
                          onClick={() => handleClearManualTag(client)}
                          className="text-xs text-gray-400 hover:text-rose-600"
                          title="Recalculer automatiquement le tag"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingClient(client)}
                        title="Voir"
                        aria-label="Voir"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <IconEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        title="Modifier"
                        aria-label="Modifier"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingClient(client)}
                        title="Supprimer"
                        aria-label="Supprimer"
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingClient && (
        <ClientViewModal client={viewingClient} onClose={() => setViewingClient(null)} />
      )}

      {editingClient && (
        <ClientEditModal
          client={editingClient}
          onSave={handleSave}
          onCancel={() => setEditingClient(null)}
        />
      )}

      {deletingClient && (
        <ConfirmModal
          title={`Supprimer "${deletingClient.name}" ?`}
          description="Cette action est définitive. Impossible si des réservations, contrats ou factures y sont associés."
          confirmLabel="Supprimer"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </div>
  );
}

export default ClientsTab;
