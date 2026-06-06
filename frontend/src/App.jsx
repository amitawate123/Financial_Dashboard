import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MuiThemeWrapper from './components/MuiThemeWrapper';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SmartDashboard from './pages/SmartDashboard';
import Transactions from './pages/Transactions';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Users from './pages/Users';
import Landing from './pages/Landing';
import { Spinner } from './components/ui';

function PrivateRoute({ children, roles }) {
  const { user, loading, can } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <Spinner size={28} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !can(roles)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

/** Auth pages: show content immediately; redirect only after session is confirmed. */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Landing: always visible; redirect logged-in users once auth finishes. */
function LandingRoute() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <MuiThemeWrapper>
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingRoute />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/smart-dashboard" element={<PrivateRoute><SmartDashboard /></PrivateRoute>} />
            <Route path="/transactions"    element={<PrivateRoute><Transactions /></PrivateRoute>} />
            <Route path="/users"        element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </MuiThemeWrapper>
    </ThemeProvider>
  );
}
