import React from 'react';
import { Navigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const ProtectedRoute = ({ children, roles }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwt_decode(token);
        const userRole = decoded.role;

        if (roles && !roles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }

        return children;
    } catch (e) {
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;