import { useState } from 'react';
import { IconSettings, IconUser, IconLock, IconReceipt, IconMail } from '../icons';
import AdminProfileSettings from './AdminProfileSettings';
import AdminSecuritySettings from './AdminSecuritySettings';
import AdminPlansSettings from './AdminPlansSettings';
import AdminEmailSettings from './AdminEmailSettings';

const SUB_TABS = [
  { id: 'profile', label: 'Mon profil', icon: IconUser },
  { id: 'security', label: 'Sécurité', icon: IconLock },
  { id: 'plans', label: 'Plans & Tarifs', icon: IconReceipt },
  { id: 'email', label: 'Email SMTP', icon: IconMail },
];

// Parametres admin (Mon profil / Securite / Plans & Tarifs / Email SMTP) :
// section distincte des autres onglets du dashboard admin, avec son propre
// en-tete (comme chaque Tab.jsx affiche deja son propre <h2>, cf.
// EventsTab/LeadsTab prestataire) plutot que de reutiliser le titre partage
// "Administration" de AdminLayout.
function AdminSettingsTab() {
  const [subTab, setSubTab] = useState('profile');

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
          <IconSettings className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-sm text-gray-500">Gestion du profil, sécurité et tarification des plans</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold w-fit">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
                active ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {subTab === 'profile' && <AdminProfileSettings />}
        {subTab === 'security' && <AdminSecuritySettings />}
        {subTab === 'plans' && <AdminPlansSettings />}
        {subTab === 'email' && <AdminEmailSettings />}
      </div>
    </div>
  );
}

export default AdminSettingsTab;
