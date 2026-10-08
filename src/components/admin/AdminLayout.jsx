import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconLogout } from '../icons';

export const ADMIN_ROLE_LABELS = {
  super_admin: 'Super Admin',
  moderator: 'Modérateur',
  support: 'Support client',
  analyst: 'Analyste',
};

function AdminLayout({ title, subtitle, tabs, activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-gray-100 bg-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-5 py-4 lg:py-6">
          <span className="text-xl font-bold text-rose-600">Mounesba</span>
          <span className="ml-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
            Admin
          </span>
        </div>

        {/* Bande d'onglets defilable horizontalement sur mobile/tablette,
            colonne pleine largeur a partir de lg. */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3 [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full lg:shrink ${
                  active ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {Icon && <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-rose-600' : 'text-gray-400'}`} />}
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-gray-100 px-5 py-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {ADMIN_ROLE_LABELS[user?.adminRole] || 'Admin'}
          </p>
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 lg:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
