import { useEffect, useState } from 'react';
import { getClients } from '../../services/clientService';
import { getContracts, createContract, updateContract, sendContract } from '../../services/contractService';
import ContractFormModal from './ContractFormModal';
import ContractEditModal from './ContractEditModal';
import ConfirmModal from './ConfirmModal';
import { IconDownload, IconEdit, IconX, IconPlus, IconFileText, IconSend } from '../icons';
import { openDocument } from '../../services/documentService';

const STATUS_LABELS = { draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé', cancelled: 'Annulé' };
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  signed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function ContractsTab() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [sendingContract, setSendingContract] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsData, clientsData] = await Promise.all([getContracts(), getClients()]);
      setContracts(contractsData);
      setClients(clientsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les contrats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (form) => {
    await createContract(form);
    setShowCreateForm(false);
    await fetchData();
  };

  const handleCancel = async (contract) => {
    try {
      await updateContract(contract.id, { status: 'cancelled' });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'annuler ce contrat.");
    }
  };

  const handleUpdate = async (form) => {
    await updateContract(editingContract.id, form);
    setEditingContract(null);
    await fetchData();
  };

  const openSendConfirm = (contract) => {
    if (!contract.client?.email) {
      setError('Ce client n\'a pas d\'adresse email enregistrée.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setSendingContract(contract);
  };

  const handleConfirmSend = async () => {
    await sendContract(sendingContract.id);
    setSuccessMessage(`Email envoyé à ${sendingContract.client.email}.`);
    setSendingContract(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Mes contrats</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <IconPlus className="h-4 w-4" />
          Créer un contrat
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Documents déclaratifs — aucun paiement n'est traité par la plateforme.
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-3 text-sm text-green-600">{successMessage}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Chargement...</p>
      ) : contracts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <IconFileText className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Aucun contrat pour le moment.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Téléphone</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Objet</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Montant</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Acompte</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Règlement</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {contract.client?.name || 'Client non spécifié'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{contract.client?.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{contract.client?.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{contract.object}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {contract.amount ? `${contract.amount} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {contract.deposit ? `${contract.deposit} DT` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {contract.paymentMode === 'rib' ? 'Virement (RIB)' : 'Espèces'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[contract.status]}`}
                    >
                      {STATUS_LABELS[contract.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={contract.pdfUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          openDocument(contract.pdfUrl);
                        }}
                        target="_blank"
                        rel="noreferrer"
                        title="Voir le PDF"
                        aria-label="Voir le PDF"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <IconDownload className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openSendConfirm(contract)}
                        title="Envoyer par email"
                        aria-label="Envoyer par email"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconSend className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingContract(contract)}
                        title="Modifier"
                        aria-label="Modifier"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-rose-600"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      {contract.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(contract)}
                          title="Annuler"
                          aria-label="Annuler"
                          className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateForm && (
        <ContractFormModal
          clients={clients}
          onSave={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingContract && (
        <ContractEditModal
          contract={editingContract}
          onSave={handleUpdate}
          onCancel={() => setEditingContract(null)}
        />
      )}

      {sendingContract && (
        <ConfirmModal
          title="Envoyer ce contrat par email ?"
          description={`Ce contrat sera envoyé à ${sendingContract.client.email}.`}
          confirmLabel="Envoyer"
          onConfirm={handleConfirmSend}
          onCancel={() => setSendingContract(null)}
        />
      )}
    </div>
  );
}

export default ContractsTab;
