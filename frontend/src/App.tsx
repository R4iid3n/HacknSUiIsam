/**
 * MODULE 7 - App with React Router
 *
 * Clean routing structure:
 * - /login - zkLogin CTA only
 * - /dashboard - Missions + rewards
 * - /scan - QR scanner
 * - /passport - User portfolio view
 * - /admin - Event management
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const LemanFlowDashboard = lazy(() =>
  import('./pages/LemanFlowDashboard').then((m) => ({ default: m.LemanFlowDashboard }))
);
const ScanPage = lazy(() =>
  import('./pages/ScanPage').then((m) => ({ default: m.ScanPage }))
);
const PassportPage = lazy(() =>
  import('./pages/PassportPage').then((m) => ({ default: m.PassportPage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const DemoHelperPage = lazy(() =>
  import('./pages/DemoHelperPage').then((m) => ({ default: m.DemoHelperPage }))
);
const HackfolioPage = lazy(() =>
  import('./pages/HackfolioPage').then((m) => ({ default: m.HackfolioPage }))
);
const AIAgentsPage = lazy(() =>
  import('./pages/AIAgentsPage').then((m) => ({ default: m.AIAgentsPage }))
);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-sky-400" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '1rem',
              },
              success: {
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />

        <Routes>
          {/* Login Page - No Navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main App with Navbar */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="/dashboard"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <LemanFlowDashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/scan"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ScanPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/passport"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <PassportPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <AdminPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/demo-helper"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <DemoHelperPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/hackfolio"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <HackfolioPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/ai-agents"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <AIAgentsPage />
                        </Suspense>
                      }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App
