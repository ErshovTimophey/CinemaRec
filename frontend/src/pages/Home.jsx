import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFilm, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const Home = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
        >
            <h1 className="text-6xl font-bold mb-4 flex items-center">
                <FaFilm className="mr-4" /> Welcome to CinemaRec
            </h1>
            <p className="text-xl mb-8">Please login or register to continue.</p>
            <div className="flex space-x-4">
                <Link
                    to="/login"
                    className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg shadow-lg hover:bg-purple-100 transition duration-300"
                >
                    <FaSignInAlt className="mr-2" /> Login
                </Link>
                <Link
                    to="/register"
                    className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg shadow-lg hover:bg-purple-100 transition duration-300"
                >
                    <FaUserPlus className="mr-2" /> Register
                </Link>
            </div>
        </motion.div>
    );
};

export default Home;