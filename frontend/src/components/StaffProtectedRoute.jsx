import { Navigate, useLocation } from 'react-router-dom';

export const StaffProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('staff_token');

  if (!token) {
    if (localStorage.getItem('parent_token')) {
      return <Navigate to="/parent" replace />;
    }
    // Redirect unauthenticated visitor to College Staff Login page
    return <Navigate to="/login/staff" state={{ from: location }} replace />;
  }

  return children;
};
