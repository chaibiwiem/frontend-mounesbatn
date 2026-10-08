import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconHeart, IconBell, IconLogout, IconLock } from '../icons';

// Cloche de notifications du dashboard prestataire : agrege les badges des
// onglets (nouvelles demandes de devis/location - onglet "leads" - et
// nouvelles demandes d'interet evenement - onglet "events", voir
// ProviderDashboard) pour un acces rapide sans devoir parcourir chaque onglet.
function NotificationBell({ tabs, onTabChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const notifications = tabs.filter((tab) => tab.badge > 0);
  const total = notifications.reduce((sum, tab) => sum + tab.badge, 0);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <IconBell className="h-5 w-5 text-gray-500" />
        <span className="hidden sm:inline">Notifications</span>
        {total > 0 && (
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-600 px-2 text-xs font-bold text-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-500">Aucune nouvelle demande.</p>
          ) : (
            notifications.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
                  <span className="flex-1">Nouvelles {tab.label.toLowerCase()}</span>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Meme structure de sidebar fixe pleine hauteur que AdminLayout (logo/marque
// en haut, nav, bloc utilisateur + deconnexion + copyright en bas) - pour
// une coherence visuelle entre les deux back-offices (admin et prestataire).
function DashboardLayout({ title, tabs, activeTab, onTabChange, logoUrl, providerName, banner, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-gray-100 bg-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-3 lg:flex-col lg:gap-2 lg:py-6 lg:text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={providerName || 'Logo'}
              className="h-12 w-12 shrink-0 rounded-full border border-gray-100 object-cover shadow-sm lg:h-16 lg:w-16"
            />
          ) : (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blue-600 shadow-sm lg:h-16 lg:w-16">
              <IconHeart className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white/30 lg:h-7 lg:w-7" />
            </div>
          )}
          {providerName && (
            <p className="max-w-full truncate text-sm font-semibold text-rose-600">{providerName}</p>
          )}
        </div>

        {/* Bande d'onglets defilable horizontalement sur mobile/tablette (pas
            de place pour une colonne fixe), colonne pleine largeur a partir
            de lg (comme AdminLayout). */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3 [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                title={tab.locked ? 'Non inclus dans votre plan' : undefined}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full lg:shrink ${
                  active
                    ? tab.locked
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-rose-50 text-rose-700'
                    : tab.locked
                      ? 'text-gray-400 hover:bg-gray-50'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-5 w-5 shrink-0 ${active && !tab.locked ? 'text-rose-600' : 'text-gray-400'}`}
                  />
                )}
                <span className="text-left lg:flex-1">{tab.label}</span>
                {tab.locked && <IconLock className="h-4 w-4 shrink-0 text-gray-400" aria-label="Verrouillé" />}
                {tab.badge > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bloc utilisateur/deconnexion complet : uniquement a partir de lg
            (pas de place en largeur sur mobile), remplace par une version
            compacte juste en dessous. */}
        <div className="hidden border-t border-gray-100 px-5 py-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Prestataire</p>
          <p className="mt-1 truncate font-semibold text-rose-600">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-rose-600"
          >
            <IconLogout className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 px-5 py-2 lg:hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-rose-600"
          >
            <IconLogout className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>

        <div className="hidden border-t border-gray-100 px-5 py-3 text-[11px] leading-tight text-gray-400 lg:block">
          © {new Date().getFullYear()} Mounesba. Tous droits réservés.
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="px-4 py-4 sm:px-6 lg:!px-[90px] lg:py-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 lg:text-2xl">{title}</h1>
            <NotificationBell tabs={tabs} onTabChange={onTabChange} />
          </div>

          {banner && <div className="mt-4">{banner}</div>}

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
