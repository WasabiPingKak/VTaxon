import { useRef, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CharacterPage from './pages/CharacterPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import BreedsPage from './pages/BreedsPage';
import DirectoryPage from './pages/DirectoryPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AboutPage from './pages/AboutPage';
import VTuberProfilePage from './pages/VTuberProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import WelcomeToast from './components/WelcomeToast';

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const treeRefetchRef = useRef(null);

  // GA4: send page_view on route change
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  const handleNewUsers = useCallback(async () => {
    await treeRefetchRef.current?.();
  }, []);

  return (
    <>
      <Navbar />
      {isHome ? (
        <Routes>
          <Route path="/" element={<HomePage treeRefetchRef={treeRefetchRef} />} />
        </Routes>
      ) : (
        <main style={{ paddingTop: 44 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<CharacterPage />} />
            <Route path="/account" element={<Navigate to="/profile?tab=account" replace />} />
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/breeds" element={<BreedsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/vtuber/:userId" element={<VTuberProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <footer style={{
            textAlign: 'center',
            padding: '32px 20px 24px',
            fontSize: '0.78em',
            color: 'rgba(255,255,255,0.25)',
          }}>
            <Link to="/about" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >關於</Link>
            {' · '}
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >隱私權政策</Link>
            {' · '}
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >服務條款</Link>
            {' · '}
            <a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >Discord</a>
            {' · '}
            <a href="https://github.com/WasabiPingKak/VTaxon" target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >GitHub</a>
          </footer>
        </main>
      )}
      <WelcomeToast onNewUsers={handleNewUsers} visible={isHome} />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
