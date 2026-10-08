import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyListing, getCategories } from '../services/listingService';
import { getListingLeads } from '../services/leadService';
import { getListingEventLeads } from '../services/providerEventService';
import { getMySubscription } from '../services/subscriptionService';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
  IconInbox,
  IconUsers,
  IconStar,
  IconUser,
  IconImage,
  IconTag,
  IconCalendar,
  IconPercent,
  IconFileText,
  IconReceipt,
  IconClipboardCheck,
  IconCrown,
  IconCar,
  IconChair,
  IconConfetti,
  IconMail,
  IconAlertTriangle,
  IconCoins,
} from '../components/icons';
import LeadsTab from '../components/provider/LeadsTab';
import ProfileTab from '../components/provider/ProfileTab';
import EmailSettingsTab from '../components/provider/EmailSettingsTab';
import GalleryTab from '../components/provider/GalleryTab';
import EventsTab from '../components/provider/EventsTab';
import PackagesTab from '../components/provider/PackagesTab';
import EquipmentsTab from '../components/provider/EquipmentsTab';
import CalendarTab from '../components/provider/CalendarTab';
import BookingsTab from '../components/provider/BookingsTab';
import FleetTab from '../components/provider/FleetTab';
import PromotionsTab from '../components/provider/PromotionsTab';
import ClientsTab from '../components/provider/ClientsTab';
import ContractsTab from '../components/provider/ContractsTab';
import InvoicesTab from '../components/provider/InvoicesTab';
import ReviewsTab from '../components/provider/ReviewsTab';
import SubscriptionTab from '../components/provider/SubscriptionTab';
import ConnectionFeesTab from '../components/provider/ConnectionFeesTab';
import ConnectionFeeTermsCard from '../components/provider/ConnectionFeeTermsCard';
import { getListingConnectionFees, formatFeeRate } from '../services/connectionFeeService';
import PlanLockedNotice from '../components/provider/PlanLockedNotice';
import { cheapestPlanLabel, cheapestPlanAbove, limitValue } from '../utils/planFeatures';

// Contenu d'un onglet verrouille par le plan (cadenas dans la sidebar) :
// titre + description de l'option + encart "non inclus dans votre plan".
function LockedTabPanel({ title, description, ...noticeProps }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-5">
        <PlanLockedNotice {...noticeProps} />
      </div>
    </div>
  );
}

const BASE_TABS = [
  { id: 'leads', label: 'Demandes', icon: IconInbox },
  { id: 'bookings', label: 'Réservations', icon: IconClipboardCheck },
  { id: 'clients', label: 'Clients (CRM)', icon: IconUsers },
  { id: 'gallery', label: 'Galerie', icon: IconImage },
  { id: 'promotions', label: 'Promotions', icon: IconPercent },
  { id: 'packages', label: 'Packs', icon: IconTag },
  { id: 'calendar', label: 'Calendrier', icon: IconCalendar },
  // Reservee aux prestataires de categorie Transport (voir isTransportProvider).
  { id: 'fleet', label: 'Ma flotte', icon: IconCar },
  { id: 'amenities', label: 'Équipements', icon: IconChair },
  { id: 'events', label: 'Mes événements', icon: IconConfetti },
  { id: 'reviews', label: 'Avis', icon: IconStar },
  { id: 'profile', label: 'Informations entreprise', icon: IconUser },
  { id: 'email-settings', label: 'Email SMTP', icon: IconMail },
  { id: 'contracts', label: 'Contrats', icon: IconFileText },
  { id: 'invoices', label: 'Factures', icon: IconReceipt },
  // Reservee aux fiches dont la categorie est concernee (voir connectionFeesConcerned).
  { id: 'connection-fees', label: 'Frais de mise en relation', icon: IconCoins },
  { id: 'subscription', label: 'Abonnement', icon: IconCrown },
];

function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [logoUrl, setLogoUrl] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [listingAddress, setListingAddress] = useState('');
  // Flotte de vehicules : uniquement pour les prestataires de la categorie
  // Transport (sous-categories "Location de voitures"/"Location de bus").
  const [isTransportProvider, setIsTransportProvider] = useState(false);
  // Sous-categorie "Maisons d'hotes" : reservations/clients/factures portent
  // un sejour (Arrivee/Depart + chambres + invites), comme la demande.
  const [isAccommodationProvider, setIsAccommodationProvider] = useState(false);
  // Fonctionnalite "Mes evenements" activable par plan (eventsEnabled,
  // Parametres admin > Plans & Tarifs - desactivee pour Starter). true par
  // defaut le temps du chargement pour ne pas faire disparaitre l'onglet a tort.
  const [eventsEnabled, setEventsEnabled] = useState(true);
  // Meme principe pour le calendrier (calendarEnabled) et les promotions
  // (maxPromotions > 0) - true par defaut le temps du chargement.
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  // Catalogue des plans (pour indiquer quel plan debloque une option
  // verrouillee) et libelle du plan reellement applique.
  const [planCatalog, setPlanCatalog] = useState(null);
  const [currentPlanLabel, setCurrentPlanLabel] = useState('');
  // Abonnement expire (n'importe quel plan, date de fin depassee ou statut
  // non "active", voir planService.isSubscriptionExpired) : le backend
  // bloque deja tous les appels API prestataire (requireActiveProvider,
  // middleware/auth.js) - ce drapeau sert a remplacer tout le dashboard par
  // un ecran de blocage clair plutot que de laisser chaque onglet echouer
  // silencieusement avec des erreurs 403 eparses.
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [expiredSubscriptionInfo, setExpiredSubscriptionInfo] = useState(null);
  // Compte les demandes non traitees (devis ou location - meme modele Lead
  // pour les deux, voir LeadsTab) pour le badge de l'onglet Demandes.
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  // Compte les demandes d'interet non traitees sur un evenement prestataire
  // (bouton "Je suis interesse(e)", liste dediee - voir EventsTab) pour le
  // badge de l'onglet Mes evenements.
  const [pendingEventLeadsCount, setPendingEventLeadsCount] = useState(0);
  // Frais de mise en relation (M13) : onglet visible uniquement si la
  // categorie de la fiche est concernee ; bandeau d'acceptation des
  // conditions tant qu'elles ne sont pas acceptees (comptes existants).
  const [connectionFees, setConnectionFees] = useState(null);

  const refreshConnectionFees = (listingId) =>
    getListingConnectionFees(listingId)
      .then(setConnectionFees)
      .catch(() => setConnectionFees(null));

  const refreshPendingLeadsCount = async (listingId) => {
    try {
      const data = await getListingLeads(listingId);
      const pending = (data.leads || []).filter((lead) => ['new', 'late'].includes(lead.status)).length;
      setPendingLeadsCount(pending);
    } catch {
      setPendingLeadsCount(0);
    }
  };

  const refreshPendingEventLeadsCount = async (listingId) => {
    try {
      const data = await getListingEventLeads(listingId);
      const pending = (data.leads || []).filter((lead) => ['new', 'late'].includes(lead.status)).length;
      setPendingEventLeadsCount(pending);
    } catch {
      setPendingEventLeadsCount(0);
    }
  };

  useEffect(() => {
    if (!user?.listingId) return;
    refreshPendingLeadsCount(user.listingId);
    refreshPendingEventLeadsCount(user.listingId);
    refreshConnectionFees(user.listingId);
    getMyListing()
      .then(async (listing) => {
        setLogoUrl(listing.logoUrl || null);
        setProviderName(listing.title || '');
        setListingAddress(listing.address || '');

        try {
          const categories = await getCategories();
          const transportCategory = categories.find((c) => c.slug === 'transport');
          const isTransport = Boolean(
            transportCategory &&
              (transportCategory.id === listing.categoryId ||
                transportCategory.children?.some((child) => child.id === listing.categoryId))
          );
          setIsTransportProvider(isTransport);
          setIsAccommodationProvider(
            categories
              .flatMap((c) => c.children || [])
              .some((child) => child.slug === 'maisons-hotes' && child.id === listing.categoryId)
          );
        } catch {
          setIsTransportProvider(false);
        }
      })
      .catch(() => {});
    getMySubscription()
      .then((subscription) => {
        // Abonnement expire : l'onglet reste visible (consultation des
        // evenements existants) meme si le plan nominal en beneficiait et
        // retombe sur Starter (effectivePlan) - seule la creation est
        // desactivee (requireActiveProvider, middleware/auth.js). Hors
        // expiration, la visibilite suit normalement le plan souscrit.
        const nominal = subscription.plans[subscription.plan] || {};
        setEventsEnabled(Boolean(subscription.isExpired || nominal.eventsEnabled));
        setCalendarEnabled(Boolean(subscription.isExpired || nominal.calendarEnabled));
        setPromotionsEnabled(Boolean(subscription.isExpired || limitValue(nominal.maxPromotions) > 0));
        setSubscriptionExpired(Boolean(subscription.isExpired));
        setPlanCatalog(subscription.plans);
        setCurrentPlanLabel(subscription.plans[subscription.effectivePlan]?.label || '');
        setExpiredSubscriptionInfo({
          planLabel: subscription.plans[subscription.plan]?.label || subscription.plan,
          endDate: subscription.endDate,
        });
      })
      .catch(() => {});
  }, [user?.listingId]);

  // Les options non incluses dans le plan restent visibles mais verrouillees
  // (cadenas dans la sidebar + encart explicatif), pour montrer au
  // prestataire ce qu'apporte un plan superieur plutot que de les masquer.
  const connectionFeesConcerned = Boolean(connectionFees?.concerned);
  const tabs = BASE_TABS.filter(
    (tab) =>
      (tab.id !== 'fleet' || isTransportProvider) && (tab.id !== 'connection-fees' || connectionFeesConcerned)
  ).map((tab) => {
    if (tab.id === 'leads') return { ...tab, badge: pendingLeadsCount };
    if (tab.id === 'events') {
      return eventsEnabled ? { ...tab, badge: pendingEventLeadsCount } : { ...tab, locked: true };
    }
    if (tab.id === 'calendar' && !calendarEnabled) return { ...tab, locked: true };
    if (tab.id === 'promotions' && !promotionsEnabled) return { ...tab, locked: true };
    return tab;
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'leads' && user?.listingId) {
      refreshPendingLeadsCount(user.listingId);
    }
    if (tabId === 'events' && user?.listingId) {
      refreshPendingEventLeadsCount(user.listingId);
    }
  };

  if (!user?.listingId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
        Aucune fiche prestataire associee a votre compte.
      </div>
    );
  }

  // Abonnement expire : le dashboard reste consultable (lecture seule) -
  // seules les actions d'ecriture sont refusees par le backend
  // (requireActiveProvider, middleware/auth.js). Bandeau persistant plutot
  // qu'un blocage total de la page, visible sur tous les onglets.
  let expiredBanner = null;
  if (subscriptionExpired) {
    const endDateLabel = expiredSubscriptionInfo?.endDate
      ? new Date(expiredSubscriptionInfo.endDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;
    expiredBanner = (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Votre abonnement {expiredSubscriptionInfo?.planLabel || ''}
          {endDateLabel ? ` a expiré le ${endDateLabel}` : " n'est plus actif"}. Vous pouvez
          consulter vos données existantes, mais l&apos;ajout ou la modification de contenu est
          désactivé jusqu&apos;au renouvellement — contactez l&apos;administrateur.
        </p>
      </div>
    );
  }

  // Conditions de frais de mise en relation non acceptees (fiche existante
  // dans une categorie concernee) : bandeau d'acceptation sur tous les onglets.
  const termsBanner =
    connectionFeesConcerned && connectionFees?.fee && !connectionFees.terms.accepted ? (
      <ConnectionFeeTermsCard
        rateLabel={formatFeeRate(connectionFees.fee)}
        onAccepted={() => refreshConnectionFees(user.listingId)}
      />
    ) : null;

  return (
    <DashboardLayout
      title="Espace prestataire"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      banner={
        expiredBanner || termsBanner ? (
          <div className="space-y-3">
            {expiredBanner}
            {activeTab !== 'connection-fees' && termsBanner}
          </div>
        ) : null
      }
      logoUrl={logoUrl}
      providerName={providerName}
    >
      {activeTab === 'leads' && (
        <LeadsTab
          listingId={user.listingId}
          isAccommodationProvider={isAccommodationProvider}
          onLeadsChange={() => refreshPendingLeadsCount(user.listingId)}
          onConnectionFeesChange={() => refreshConnectionFees(user.listingId)}
        />
      )}
      {activeTab === 'bookings' && (
        <BookingsTab
          listingId={user.listingId}
          isTransportProvider={isTransportProvider}
          isAccommodationProvider={isAccommodationProvider}
        />
      )}
      {activeTab === 'clients' && <ClientsTab listingId={user.listingId} />}
      {activeTab === 'reviews' && <ReviewsTab listingId={user.listingId} />}
      {activeTab === 'profile' && (
        <ProfileTab listingId={user.listingId} logoUrl={logoUrl} onLogoChange={setLogoUrl} />
      )}
      {activeTab === 'email-settings' && <EmailSettingsTab />}
      {activeTab === 'gallery' && <GalleryTab listingId={user.listingId} />}
      {activeTab === 'events' &&
        (eventsEnabled ? (
          <EventsTab
            listingId={user.listingId}
            listingAddress={listingAddress}
            onLeadsChange={() => refreshPendingEventLeadsCount(user.listingId)}
          />
        ) : (
          <LockedTabPanel
            title="Mes événements"
            description="Publiez vos journées portes ouvertes, show cookings, défilés ou lancements pour attirer de nouvelles demandes."
            feature="Mes événements"
            currentPlan={currentPlanLabel}
            requiredPlan={cheapestPlanLabel(planCatalog, (plan) => plan.eventsEnabled)}
            onUpgrade={() => setActiveTab('subscription')}
          />
        ))}
      {activeTab === 'packages' && <PackagesTab listingId={user.listingId} />}
      {activeTab === 'amenities' && <EquipmentsTab listingId={user.listingId} />}
      {activeTab === 'calendar' &&
        (calendarEnabled ? (
          <CalendarTab listingId={user.listingId} />
        ) : (
          <LockedTabPanel
            title="Votre calendrier"
            description="Indiquez vos jours de disponibilité pour guider les clients et éviter les demandes sur des dates déjà prises."
            feature="Calendrier des disponibilités"
            currentPlan={currentPlanLabel}
            requiredPlan={cheapestPlanLabel(planCatalog, (plan) => plan.calendarEnabled)}
            onUpgrade={() => setActiveTab('subscription')}
          />
        ))}
      {activeTab === 'fleet' && isTransportProvider && <FleetTab listingId={user.listingId} />}
      {activeTab === 'promotions' &&
        (promotionsEnabled ? (
          <PromotionsTab listingId={user.listingId} />
        ) : (
          <LockedTabPanel
            title="Mes promotions"
            description="Mettez en avant des offres (pourcentage ou montant fixe) affichées sur votre fiche."
            feature="Promotions"
            currentPlan={currentPlanLabel}
            requiredPlan={cheapestPlanAbove(planCatalog, 'maxPromotions', 0)}
            onUpgrade={() => setActiveTab('subscription')}
          />
        ))}
      {activeTab === 'contracts' && <ContractsTab listingId={user.listingId} />}
      {activeTab === 'invoices' && <InvoicesTab listingId={user.listingId} />}
      {activeTab === 'subscription' && <SubscriptionTab />}
      {activeTab === 'connection-fees' && connectionFeesConcerned && (
        <ConnectionFeesTab listingId={user.listingId} onChange={() => refreshConnectionFees(user.listingId)} />
      )}
    </DashboardLayout>
  );
}

export default ProviderDashboard;
