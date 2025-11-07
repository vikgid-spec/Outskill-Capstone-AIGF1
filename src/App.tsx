import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import POListPage from './components/POListPage';
import ConsigneeListPage from './components/ConsigneeListPage';
import SupplierListPage from './components/SupplierListPage';
import DebtorListPage from './components/DebtorListPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import DemoRequestPage from './components/DemoRequestPage';
import JoinWaitlistPage from './components/JoinWaitlistPage';
import ThankYouPage from './components/ThankYouPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// SessionTimeoutWarning disabled - no automatic logout

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

      return <>{children}</>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/home" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } />
          <Route path="/demorequests" element={
            <PublicRoute>
              <DemoRequestPage />
            </PublicRoute>
          } />
          <Route path="/joinwaitlist" element={
            <PublicRoute>
              <JoinWaitlistPage />
            </PublicRoute>
          } />
          <Route path="/thank-you" element={
            <PublicRoute>
              <ThankYouPage />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/polist" element={
            <ProtectedRoute>
              <POListPage />
            </ProtectedRoute>
          } />
          <Route path="/consigneelist" element={
            <ProtectedRoute>
              <ConsigneeListPage />
            </ProtectedRoute>
          } />
          <Route path="/supplierlist" element={
            <ProtectedRoute>
              <SupplierListPage />
            </ProtectedRoute>
          } />
          <Route path="/debtorlist" element={
            <ProtectedRoute>
              <DebtorListPage />
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
