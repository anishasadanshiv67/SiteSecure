import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import SuperAdminControlPanel from './pages/dashboard/SuperAdminControlPanel';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import UserManagement from './pages/dashboard/UserManagement';
import Settings from './pages/dashboard/Settings';

import { AuthProvider } from './context/AuthContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Inner component so useTranslation hook works inside AuthProvider
function AppRoutes() {
  const { i18n } = useTranslation();
  // Key forces full re-render of all routes on language change
  return (
    <BrowserRouter key={i18n.language}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard/flagger" element={<ProtectedRoute allowedRoles={['flagger']}><FlaggerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/flagger/report" element={<ProtectedRoute allowedRoles={['flagger']}><ReportIncident /></ProtectedRoute>} />
        <Route path="/dashboard/flagger/my-reports" element={<ProtectedRoute allowedRoles={['flagger']}><MyReports /></ProtectedRoute>} />
        <Route path="/dashboard/verification" element={<ProtectedRoute allowedRoles={['online_verifier', 'ground_verifier']}><VerificationDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/security" element={<ProtectedRoute allowedRoles={['site_admin', 'super_admin']}><SecurityLog /></ProtectedRoute>} />
        <Route path="/dashboard/resolution" element={<ProtectedRoute allowedRoles={['resolver']}><ResolverDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['site_admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/superadmin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminControlPanel /></ProtectedRoute>} />
        <Route path="/dashboard/compliance" element={<ProtectedRoute allowedRoles={['compliance_officer', 'super_admin']}><ComplianceDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute allowedRoles={['super_admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={['site_admin', 'super_admin']}><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
