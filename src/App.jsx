import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { ThemeProvider } from './lib/theme.jsx';
import { LangProvider } from './lib/i18n.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Home from './pages/Home.jsx';
import Modules from './pages/Modules.jsx';
import ModuleDetail from './pages/ModuleDetail.jsx';
import Progress from './pages/Progress.jsx';
import AskGad from './pages/AskGad.jsx';
import Profile from './pages/Profile.jsx';
import Payments from './pages/PaymentsAndSubscription.jsx';
import Settings from './pages/Settings.jsx';
import ManualPayment from './pages/ManualPayment.jsx';
import TodaysRoutine from './pages/TodaysRoutine.jsx';
import Notifications from './pages/Notifications.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--green-light)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/modules" element={<PrivateRoute><Modules /></PrivateRoute>} />
              <Route path="/modules/:id" element={<PrivateRoute><ModuleDetail /></PrivateRoute>} />
              <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
              <Route path="/ask-gad" element={<PrivateRoute><AskGad /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/manual-payment" element={<PrivateRoute><ManualPayment /></PrivateRoute>} />
              <Route path="/routine" element={<PrivateRoute><TodaysRoutine /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
