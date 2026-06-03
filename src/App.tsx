/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ReportDetailPage from './pages/ReportDetailPage';
import ReportsPage from './pages/ReportsPage';
import MarketPage from './pages/MarketPage';
import JobDetailPage from './pages/JobDetailPage';
import AdminPage from './pages/AdminPage';

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

                {/* 🏠 Homepage - Market Intelligence Dashboard */}
                <Route path="/" element={<HomePage />} />

                {/* 📊 Market Telemetry Stream */}
                <Route path="/market" element={<MarketPage />} />
                {/* ✅ SEO-friendly search route */}
                <Route path="/market/search/:query" element={<MarketPage />} />

                {/* 💼 Individual Job Detail Page */}
                <Route path="/job/:jobId" element={<JobDetailPage />} />

                {/* 📰 Reports */}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/report/:slug" element={<ReportDetailPage />} />

                {/* 🔐 Admin */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Optional fallback routes */}
                <Route path="/jobs" element={<Navigate to="/market" replace />} />
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
