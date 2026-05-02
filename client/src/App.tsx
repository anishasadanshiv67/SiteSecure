import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import FlaggerDashboard from './pages/dashboard/FlaggerDashboard';
import ReportIncident from './pages/dashboard/ReportIncident';
import MyReports from './pages/dashboard/MyReports';
import VerificationDashboard from './pages/dashboard/VerificationDashboard';
import SecurityLog from './pages/dashboard/SecurityLog';
import ResolverDashboard from './pages/dashboard/ResolverDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

import { AuthProvider } from './context/AuthContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Dashboard Routes */}
          <Route 
            path="/dashboard/flagger" 
            element={
              <ProtectedRoute allowedRoles={['flagger']}>
                <FlaggerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/flagger/report" 
            element={
              <ProtectedRoute allowedRoles={['flagger']}>
                <ReportIncident />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/flagger/my-reports" 
            element={
              <ProtectedRoute allowedRoles={['flagger']}>
                <MyReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/verification" 
            element={
              <ProtectedRoute allowedRoles={['online_verifier', 'ground_verifier']}>
                <VerificationDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/security" 
            element={
              <ProtectedRoute allowedRoles={['site_admin', 'super_admin']}>
                <SecurityLog />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/resolution" 
            element={
              <ProtectedRoute allowedRoles={['resolver']}>
                <ResolverDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRoles={['site_admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
