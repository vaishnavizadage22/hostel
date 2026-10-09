import { Navigate, useLocation } from 'react-router-dom';

export const WardenProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('warden_token');

  if (!token) {
    if (localStorage.getItem('parent_token')) {
      return <Navigate to="/parent" replace />;
    }
    // Redirect unauthenticated visitor to Warden Login page
    return <Navigate to="/login/warden" state={{ from: location }} replace />;
  }

  return children;
};
