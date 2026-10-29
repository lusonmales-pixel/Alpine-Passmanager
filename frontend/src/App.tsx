import { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import { NotFoundPage } from './app/NotFoundPage';
import { PublicOnly, RequireAuth } from './app/guards';
import { ToastProvider } from './components/ui/toast/ToastProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { LandingPage } from './features/landing/LandingPage';
import { VaultPage } from './features/vault/VaultPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <ScrollToTop />
        <ToastProvider>
          <AuthProvider>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <PublicOnly>
                    <LoginPage />
                  </PublicOnly>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnly>
                    <RegisterPage />
                  </PublicOnly>
                }
              />
              <Route
                path="/vault/*"
                element={
                  <RequireAuth>
                    <VaultPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
