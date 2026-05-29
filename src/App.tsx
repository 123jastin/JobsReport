/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ReportDetailPage from './pages/ReportDetailPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';

// NEW PAGES (you will create these)
import RolePage from './pages/RolePage';
import CompanyPage from './pages/CompanyPage';

import { AuthProvider } from './context/AuthContext';
import { CountryProvider } from './context/CountryContext';
import { CareerRedirectProvider } from './context/CareerRedirectContext';

export default function App() {
  return (
    <CountryProvider>
      <CareerRedirectProvider>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>

                {/* 🏠 Homepage */}
                <Route path="/" element={<HomePage />} />

                {/* 📰 Reports */}
                <Route path="/report/:slug" element={<ReportDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />

                {/* 🧠 Intelligence Pages */}
                <Route path="/role/:slug" element={<RolePage />} />
                <Route path="/company/:id" element={<CompanyPage />} />

                {/* 🔐 Admin */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Optional fallback routes */}
                <Route path="/companies" element={<Navigate to="/" replace />} />

                {/* ❌ Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </CareerRedirectProvider>
    </CountryProvider>
  );
}
