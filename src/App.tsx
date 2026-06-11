/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CountryPage from './pages/CountryPage';
import CompaniesPage from './pages/CompaniesPage';
import RegionsPage from './pages/RegionsPage';
import RegionPage from './pages/RegionPage';
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
                {/* 🏠 Homepage */}
                <Route path="/" element={<HomePage />} />

                {/* 🌍 Country Pages - SEO Indexable */}
                <Route path="/country/:slug" element={<CountryPage />} />
                <Route path="/jobs-in/:slug" element={<CountryPage />} />

                {/* 📍 Regions Pages - SEO Indexable */}
                <Route path="/regions" element={<RegionsPage />} />
                <Route path="/country/:countrySlug/region/:regionSlug" element={<RegionPage />} />

                {/* 🏢 Companies Page */}
                <Route path="/companies" element={<CompaniesPage />} />

                {/* 🎯 Role/Category Pages - SEO Indexable */}
                <Route path="/role/:roleSlug" element={<MarketPage />} />

                {/* 📊 Market Routes */}
                <Route path="/market/search/:query" element={<MarketPage />} />
                <Route path="/market/:jobId" element={<JobDetailPage />} />
                <Route path="/market" element={<MarketPage />} />

                {/* 📰 Reports - Country-specific indexable pages */}
                <Route path="/reports/:country" element={<ReportsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/report/:slug" element={<ReportDetailPage />} />

                {/* 🔐 Admin */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Fallbacks */}
                <Route path="/jobs" element={<Navigate to="/market" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </CareerRedirectProvider>
    </CountryProvider>
  );
}
