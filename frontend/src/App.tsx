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
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { LemanFlowDashboard } from './pages/LemanFlowDashboard';
import { ScanPage } from './pages/ScanPage';
import { PassportPage } from './pages/PassportPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <Toaster position="top-right" />

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
                    <Route path="/dashboard" element={<LemanFlowDashboard />} />
                    <Route path="/scan" element={<ScanPage />} />
                    <Route path="/passport" element={<PassportPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
