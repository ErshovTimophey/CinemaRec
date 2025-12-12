import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';
import OAuth2RedirectPage from './pages/OAuth2RedirectPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/user/Dashboard';
import MoviePlayer from './pages/user/MoviePlayer';
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
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/watch/:movieId" element={
                    <ProtectedRoute>
                        <MoviePlayer />
                    </ProtectedRoute>
                } />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;