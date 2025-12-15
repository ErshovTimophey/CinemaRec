import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaSignInAlt, FaUserPlus, FaFilm, FaChartBar, FaPenAlt, FaQuestionCircle, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import jwt_decode from 'jwt-decode';

const isAuthenticated = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        const decoded = jwt_decode(token);
        if (decoded.exp * 1000 < Date.now()) return false;
        return true;
    } catch {
        return false;
    }
};

const Navbar = () => {
    const [authenticated, setAuthenticated] = useState(isAuthenticated);
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutMenuOpen, setLogoutMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const logoutMenuRef = useRef(null);

    const homeLink = !authenticated ? '/' : (['/login', '/register', '/'].includes(location.pathname) ? '/' : '/dashboard');

    const dashboardLinks = [
        { to: '/dashboard?tab=recommendations', icon: FaFilm, label: 'Recommendations' },
        { to: '/dashboard?tab=statistics', icon: FaChartBar, label: 'Statistics' },
        { to: '/dashboard?tab=reviews', icon: FaPenAlt, label: 'Reviews' },
        { to: '/dashboard?tab=quizzes', icon: FaQuestionCircle, label: 'Quizzes' },
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (logoutMenuRef.current && !logoutMenuRef.current.contains(e.target)) {
                setLogoutMenuOpen(false);
            }
        };
        if (menuOpen || logoutMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen, logoutMenuOpen]);

    useEffect(() => {
        setAuthenticated(isAuthenticated());
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setMenuOpen(false);
        setLogoutMenuOpen(false);
        setAuthenticated(false);
        navigate('/login');
    };

    const linkClass = "text-white flex items-center hover:text-purple-200 transition duration-300 whitespace-nowrap";
    const activeTab = new URLSearchParams(location.search).get('tab') || 'recommendations';

    return (
        <nav className="bg-purple-600 p-3 sm:p-4">
            <div className="container mx-auto flex justify-between items-center gap-2">
                <Link to={homeLink} className="text-white text-xl sm:text-2xl font-bold flex items-center shrink-0">
                    <FaHome className="mr-2" /> CinemaRec
                </Link>

                {/* Desktop nav: only Login/Register when not authenticated; dashboard links only when authenticated. */}
                <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                    {!authenticated ? (
                        <>
                            <Link to="/login" className={`${linkClass} px-2 py-1`}>
                                <FaSignInAlt className="mr-2" /> Login
                            </Link>
                            <Link to="/register" className={`${linkClass} px-2 py-1`}>
                                <FaUserPlus className="mr-2" /> Register
                            </Link>
                        </>
                    ) : (
                        <>
                            {dashboardLinks.map(({ to, icon: Icon, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`${linkClass} px-2 py-1.5 rounded-lg ${activeTab === to.split('=')[1] ? 'bg-purple-800' : ''}`}
                                >
                                    <Icon className="mr-1.5 shrink-0" />
                                    <span className="hidden lg:inline">{label}</span>
                                </Link>
                            ))}
                            <div className="relative flex items-center" ref={logoutMenuRef}>
                                <button
                                    onClick={() => setLogoutMenuOpen(!logoutMenuOpen)}
                                    className="text-white p-2 rounded-lg hover:bg-purple-700 transition"
                                    aria-label="Account menu"
                                >
                                    <FaBars className="text-lg" />
                                </button>
                                {logoutMenuOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-40 bg-purple-700 border border-purple-500 rounded-lg shadow-xl py-2 z-50">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2.5 text-white hover:bg-purple-800 transition"
                                        >
                                            <FaSignOutAlt className="mr-3 shrink-0" />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile: hamburger + dropdown */}
                <div className="lg:hidden relative flex items-center" ref={menuRef}>
                    {!authenticated ? (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className={`${linkClass} text-sm`}>
                                <FaSignInAlt className="mr-1" /> Login
                            </Link>
                            <Link to="/register" className={`${linkClass} text-sm`}>
                                <FaUserPlus className="mr-1" /> Register
                            </Link>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="text-white p-2 rounded-lg hover:bg-purple-700 transition"
                                aria-label="Menu"
                            >
                                {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                            </button>
                            {menuOpen && (
                                <div className="absolute top-full right-4 mt-2 w-56 bg-purple-700 border border-purple-500 rounded-lg shadow-xl py-2 z-50">
                                    {dashboardLinks.map(({ to, icon: Icon, label }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex items-center w-full px-4 py-2.5 text-white hover:bg-purple-800 transition ${activeTab === to.split('=')[1] ? 'bg-purple-800' : ''}`}
                                        >
                                            <Icon className="mr-3 shrink-0" />
                                            {label}
                                        </Link>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2.5 text-white hover:bg-purple-800 transition border-t border-purple-600"
                                    >
                                        <FaSignOutAlt className="mr-3" />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
