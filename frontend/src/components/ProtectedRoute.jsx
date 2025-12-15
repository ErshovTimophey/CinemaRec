import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');

    const loginRedirect = (replace = true) => (
        <Navigate to="/login" replace={replace} state={{ from: location, requireAuth: true }} />
    );

    if (!token) {
        return loginRedirect();
    }

    try {
        const decoded = jwt_decode(token);

        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            return loginRedirect();
        }

        return children;
    } catch (e) {
        localStorage.removeItem('token');
        return loginRedirect();
    }
};

export default ProtectedRoute;