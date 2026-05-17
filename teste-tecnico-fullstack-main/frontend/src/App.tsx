import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Activate from './pages/Activate';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Workspace from './pages/Workspace';
import './styles/main.scss';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  const defaultRoute = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />;
    if (user?.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/workspace" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={defaultRoute()} />
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<Activate />} />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute roles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute roles={['owner', 'user']}>
            <Workspace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
