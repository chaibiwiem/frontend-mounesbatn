import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';

// Chargement a la demande (code splitting) : chaque page n'est telechargee
// que lorsqu'on la visite. Sans ca, un visiteur de la page d'accueil
// telechargeait aussi les dashboards admin/prestataire/client et tous les
// formulaires (un seul fichier JS de ~870 Ko). L'accueil reste dans le
// fichier principal : c'est la premiere page vue par la plupart des visiteurs.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CategoryLanding = lazy(() => import('./pages/CategoryLanding'));
const PrestatairesLanding = lazy(() => import('./pages/PrestatairesLanding'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const LegalCenter = lazy(() => import('./pages/LegalCenter'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Affiche pendant le telechargement d'une page (generalement < 1 s) : garde
// la hauteur de la zone de contenu pour que le footer ne "saute" pas.
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Chargement">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-rose-500" />
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  // Le dashboard admin a sa propre mise en page (sidebar dediee) : pas de
  // navbar globale sur ces pages.
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/categorie/:slug" element={<CategoryLanding />} />
        <Route path="/prestataires" element={<PrestatairesLanding />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />
        <Route path="/politique-de-cookies" element={<CookiePolicy />} />
        <Route path="/centre-legal" element={<LegalCenter />} />
        <Route path="/centre-aide" element={<HelpCenter />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        {/* URL publique SEO : /:categorySlug/:listingSlug (ex. /traiteur/traiteur-sonia).
            Placee en dernier : React Router v6 classe les routes par
            specificite (segments statiques d'abord), donc ce joker generique
            ne masque jamais /login, /search, /reset-password/:token, etc. */}
        <Route path="/:categorySlug/:listingSlug" element={<ListingDetail />} />
        <Route
          path="/prestataire/dashboard"
          element={
            <PrivateRoute roles={['provider']}>
              <ProviderDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/dashboard"
          element={
            <PrivateRoute roles={['client']}>
              <ClientDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
      </Suspense>
      {!hideNavbar && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
