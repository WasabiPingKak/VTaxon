import React, { useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import Navbar from './components/Navbar';
import WelcomeToast from './components/WelcomeToast';
import YouTubeChannelBanner from './components/YouTubeChannelBanner';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const VTuberProfilePage = lazy(() => import('./pages/VTuberProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '60vh', color: 'rgba(255,255,255,0.3)', fontSize: '0.9em',
    }}>
      載入中…
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const treeRefetchRef = useRef<(() => Promise<void>) | null>(null);

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
      <YouTubeChannelBanner />
      <Suspense fallback={<LoadingFallback />}>
        {isHome ? (
          <Routes>
            <Route path="/" element={<HomePage treeRefetchRef={treeRefetchRef} />} />
          </Routes>
        ) : (
          <main style={mainStyle}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<CharacterPage />} />
              <Route path="/account" element={<Navigate to="/profile?tab=account" replace />} />
              <Route path="/settings" element={<Navigate to="/profile" replace />} />
              <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/breeds" element={<Navigate to="/profile?tab=species" replace />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="/vtuber/:userId" element={<VTuberProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <footer className="vtaxon-footer" style={footerStyle}>
              <Link to="/about" className="vtaxon-footer-link">關於</Link>
              {' · '}
              <Link to="/changelog" className="vtaxon-footer-link">更新日誌</Link>
              {' · '}
              <Link to="/privacy" className="vtaxon-footer-link">隱私權政策</Link>
              {' · '}
              <Link to="/terms" className="vtaxon-footer-link">服務條款</Link>
              {' · '}
              <a href="https://discord.gg/ABpdGBbDe4" target="_blank" rel="noopener noreferrer"
                className="vtaxon-footer-link">Discord</a>
              {' · '}
              <a href="https://github.com/WasabiPingKak/VTaxon" target="_blank" rel="noopener noreferrer"
                className="vtaxon-footer-link">GitHub</a>
            </footer>
          </main>
        )}
      </Suspense>
      <WelcomeToast onNewUsers={handleNewUsers} visible={isHome} />
    </>
  );
}

const mainStyle: React.CSSProperties = { paddingTop: 44 };
const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px 20px 24px',
  fontSize: '0.78em',
  color: 'rgba(255,255,255,0.25)',
};

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
