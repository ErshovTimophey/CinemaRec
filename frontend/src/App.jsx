import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';
import OAuth2RedirectPage from './pages/OAuth2RedirectPage'; // Добавьте этот импорт
import ProtectedRoute from './components/ProtectedRoute'; // Добавьте этот импорт
import AdminDashboard from './pages/admin/AdminDashboard'; // Добавьте этот импорт
import './index.css';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
                <Route path="/admin" element={
                    <ProtectedRoute roles={['ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;