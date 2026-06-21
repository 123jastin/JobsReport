/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import RouteTracker from './components/RouteTracker';
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
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DisclaimerPage from './pages/DisclaimerPage';

import { AuthProvider } from './context/AuthContext';
import { CountryProvider } from './context/CountryContext';
import { CareerRedirectProvider } from './context/CareerRedirectContext';

export default function App() {
  return (
    <CountryProvider>
      <CareerRedirectProvider>
        <AuthProvider>
          <Router>
            {/* 🔥 Track GA pageviews on every route change */}
            <RouteTracker />
            
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

                {/* 🏢 Companies Routes */}
                <Route path="/companies/:companyName" element={<CompaniesPage />} />
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

                {/* 📄 Legal & Info Pages */}
                <Route path="/about-us" element={<AboutUsPage />} />
                <Route path="/contact-us" element={<ContactUsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />

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
