import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
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

// Pages chargees a la demande (code splitting) : la page d'accueil reste dans
// le bundle principal, les autres - surtout les dashboards - ne sont
// telechargees que lorsqu'on les ouvre.

function AppShell() {
  const location = useLocation();
  // Le dashboard admin a sa propre mise en page (sidebar dediee) : pas de
  // navbar globale sur ces pages.
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
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
