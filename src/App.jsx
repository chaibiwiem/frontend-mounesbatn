import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import SearchResults from './pages/SearchResults';
import CategoryLanding from './pages/CategoryLanding';
import PrestatairesLanding from './pages/PrestatairesLanding';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import LegalCenter from './pages/LegalCenter';
import HelpCenter from './pages/HelpCenter';
import ListingDetail from './pages/ListingDetail';
import ProviderDashboard from './pages/ProviderDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppShell() {
  const location = useLocation();
  // Le dashboard admin a sa propre mise en page (sidebar dediee) : pas de
  // navbar globale sur ces pages.
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
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
