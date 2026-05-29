/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminPage from './pages/AdminPage';
import JobsPage from './pages/JobsPage';
import ReportsPage from './pages/ReportsPage';
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
                <Route path="/" element={<HomePage />} />
                <Route path="/report/:id" element={<ReportDetailPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                
                {/* Fallback routes for demo purposes */}
                <Route path="/companies" element={<HomePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </CareerRedirectProvider>
    </CountryProvider>
  );
}
