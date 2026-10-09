import { Navigate, useLocation } from 'react-router-dom';

export const ParentProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('parent_token');

  if (!token) {
    // Redirect unauthenticated visitor to Parent Login page
    return <Navigate to="/login/parent" state={{ from: location }} replace />;
  }

  return children;
};
