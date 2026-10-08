import { useEffect, useState } from 'react';
import { getForceDeletePreview, forceDeleteProvider } from '../../services/adminService';

const COUNT_LABELS = [
  ['leads', 'demande(s) de devis'],
  ['reviews', 'avis'],
  ['bookings', 'réservation(s)'],
  ['vehicleBookings', 'location(s) de véhicule'],
  ['clients', 'client(s) CRM'],
  ['contracts', 'contrat(s)'],
  ['invoices', 'facture(s)'],
  ['disputes', 'litige(s)'],
];

// Suppression DEFINITIVE d'une fiche et de toutes ses donnees liees : montre
// d'abord l'inventaire exact, puis exige de ressaisir le nom de la fiche
// (protection contre un clic par erreur - action irreversible).
function ForceDeleteProviderModal({ listing, onCancel, onDeleted }) {
  const [preview, setPreview] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [deleteOwnerAccount, setDeleteOwnerAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getForceDeletePreview(listing.id)
      .then((data) => {
        setPreview(data);
        setDeleteOwnerAccount(!data.ownerHasOtherListings);
      })
      .catch((err) => setError(err.response?.data?.message || "Impossible de charger l'inventaire."));
  }, [listing.id]);

  const linked = preview ? COUNT_LABELS.filter(([key]) => preview.counts[key] > 0) : [];
  const confirmed = confirmTitle.trim() === listing.title.trim();

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await forceDeleteProvider(listing.id, { confirmTitle, deleteOwnerAccount });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Suppression impossible.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Supprimer définitivement « {listing.title} » ?</h3>
        <p className="mt-2 text-sm text-red-600">
          Action irréversible : la fiche et toutes ses données seront effacées de la base, sans restauration possible.
        </p>

        {!preview && !error && <p className="mt-4 text-sm text-gray-500">Chargement de l&apos;inventaire...</p>}

        {preview && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium">Seront aussi supprimés :</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>photos, vidéos, packs, promotions et disponibilités</li>
              {linked.map(([key, label]) => (
                <li key={key} className={key === 'invoices' || key === 'contracts' ? 'font-semibold text-red-600' : ''}>
                  {preview.counts[key]} {label}
                </li>
              ))}
            </ul>
            {(preview.counts.invoices > 0 || preview.counts.contracts > 0) && (
              <p className="mt-2 text-xs text-red-600">
                Factures et contrats inclus : pensez à en conserver une copie pour votre comptabilité avant de
                confirmer.
              </p>
            )}
          </div>
        )}

        {preview && !preview.ownerHasOtherListings && (
          <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={deleteOwnerAccount}
              onChange={(e) => setDeleteOwnerAccount(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Supprimer aussi le compte du prestataire ({listing.owner?.email}) et son abonnement — l&apos;email
              pourra être réutilisé.
            </span>
          </label>
        )}

        {preview && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Pour confirmer, saisissez le nom de la fiche : <span className="font-semibold">{listing.title}</span>
            </label>
            <input
              value={confirmTitle}
              onChange={(e) => setConfirmTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed || submitting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {submitting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForceDeleteProviderModal;
