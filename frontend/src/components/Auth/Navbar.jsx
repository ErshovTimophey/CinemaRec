import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const Navbar = () => {
    return (
        <nav className="bg-purple-600 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-white text-2xl font-bold flex items-center">
                    <FaHome className="mr-2" /> CinemaRec
                </Link>
                <div className="flex space-x-4">
                    <Link
                        to="/login"
                        className="text-white flex items-center hover:text-purple-200 transition duration-300"
                    >
                        <FaSignInAlt className="mr-2" /> Login
                    </Link>
                    <Link
                        to="/register"
                        className="text-white flex items-center hover:text-purple-200 transition duration-300"
                    >
                        <FaUserPlus className="mr-2" /> Register
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;