import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CharacterPage from './pages/CharacterPage';
import AccountPage from './pages/AccountPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Navbar />
      {isHome ? (
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      ) : (
        <main style={{ paddingTop: 44 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<CharacterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
