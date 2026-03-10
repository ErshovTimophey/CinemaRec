import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  const redirectToLogin = () => (
    <Navigate to="/login" replace state={{ from: location, requireAuth: true }} />
  );

  if (!token) {
    return redirectToLogin();
  }

  try {
    const decoded = jwt_decode(token);

    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return redirectToLogin();
    }

    const role = decoded.role;
    if (role !== 'ADMIN') {
      // Not an admin – send to normal dashboard or home
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem('token');
    return redirectToLogin();
  }
};

export default AdminRoute;

