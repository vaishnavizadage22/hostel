import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    if (localStorage.getItem('parent_token')) {
      return <Navigate to="/parent" replace />;
    }
    // Normal user or unauthenticated visitor trying to access /admin -> redirect to Login
    return <Navigate to="/login/admin" replace />;
  }

  return children;
};
