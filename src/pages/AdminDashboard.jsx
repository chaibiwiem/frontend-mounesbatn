import { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  IconChart,
  IconUserCheck,
  IconAlertTriangle,
  IconFlag,
  IconBuilding,
  IconTrash,
  IconTag,
  IconReceipt,
  IconUser,
  IconMapPin,
  IconCoins,
} from '../components/icons';
import PendingProvidersTab from '../components/admin/PendingProvidersTab';
import ProvidersTab from '../components/admin/ProvidersTab';
import DeletedProvidersTab from '../components/admin/DeletedProvidersTab';
import DashboardStatsTab from '../components/admin/DashboardStatsTab';
import DisputesTab from '../components/admin/DisputesTab';
import ReportedReviewsTab from '../components/admin/ReportedReviewsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import CitiesTab from '../components/admin/CitiesTab';
import BillingTab from '../components/admin/BillingTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import ConnectionFeesAdminTab from '../components/admin/ConnectionFeesAdminTab';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: IconChart },
  { id: 'providers', label: 'Prestataires', icon: IconBuilding },
  { id: 'validation', label: 'Validation prestataires', icon: IconUserCheck },
  { id: 'categories', label: 'Catégories', icon: IconTag },
  { id: 'cities', label: 'Villes / Régions', icon: IconMapPin },
  { id: 'billing', label: 'Facturation', icon: IconReceipt },
  { id: 'connection-fees', label: 'Frais de mise en relation', icon: IconCoins },
  { id: 'deleted', label: 'Supprimés', icon: IconTrash },
  { id: 'disputes', label: 'Litiges', icon: IconAlertTriangle },
  { id: 'reviews', label: 'Avis signales', icon: IconFlag },
  { id: 'settings', label: 'Paramètres', icon: IconUser },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AdminLayout
      title="Administration"
      subtitle="Supervision et pilotage de la plateforme Mounesba"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'dashboard' && <DashboardStatsTab />}
      {activeTab === 'providers' && <ProvidersTab />}
      {activeTab === 'validation' && <PendingProvidersTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'cities' && <CitiesTab />}
      {activeTab === 'billing' && <BillingTab />}
      {activeTab === 'connection-fees' && <ConnectionFeesAdminTab />}
      {activeTab === 'deleted' && <DeletedProvidersTab />}
      {activeTab === 'disputes' && <DisputesTab />}
      {activeTab === 'reviews' && <ReportedReviewsTab />}
      {activeTab === 'settings' && <AdminSettingsTab />}
    </AdminLayout>
  );
}

export default AdminDashboard;
