import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilm, FaChartBar, FaPenAlt, FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import MovieRecommendations from './MovieRecommendations';
import Statistics from './Statistics';
import Reviews from './Reviews';
import Quizzes from './Quizzes';
import jwt_decode from 'jwt-decode';


const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('recommendations');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const token = localStorage.getItem('token');
    let email = null;

    if (token) {
        try {
            const decoded = jwt_decode(token);
            console.log('Decoded JWT:', decoded);
            email = decoded.sub;
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gray-100"
        >
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-purple-700 text-white min-h-screen p-4">
                    <h2 className="text-2xl font-bold mb-8 mt-4">CinemaRec</h2>

                    <nav>
                        <ul className="space-y-4">
                            <li>
                                <button
                                    onClick={() => setActiveTab('recommendations')}
                                    className={`flex items-center w-full p-3 rounded-lg transition ${activeTab === 'recommendations' ? 'bg-purple-900' : 'hover:bg-purple-800'}`}
                                >
                                    <FaFilm className="mr-3" />
                                    Recommendations
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('statistics')}
                                    className={`flex items-center w-full p-3 rounded-lg transition ${activeTab === 'statistics' ? 'bg-purple-900' : 'hover:bg-purple-800'}`}
                                >
                                    <FaChartBar className="mr-3" />
                                    Statistics
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`flex items-center w-full p-3 rounded-lg transition ${activeTab === 'reviews' ? 'bg-purple-900' : 'hover:bg-purple-800'}`}
                                >
                                    <FaPenAlt className="mr-3" />
                                    Reviews
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('quizzes')}
                                    className={`flex items-center w-full p-3 rounded-lg transition ${activeTab === 'quizzes' ? 'bg-purple-900' : 'hover:bg-purple-800'}`}
                                >
                                    <FaQuestionCircle className="mr-3" />
                                    Quizzes
                                </button>
                            </li>
                        </ul>
                    </nav>

                    <div className="mt-8 pt-4 border-t border-purple-600">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-3 rounded-lg hover:bg-purple-800 transition"
                        >
                            <FaSignOutAlt className="mr-3" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    {activeTab === 'recommendations' && email && <MovieRecommendations email={email} />}
                    {activeTab === 'statistics' && <Statistics />}
                    {activeTab === 'reviews' && email && <Reviews email={email} />}
                    {activeTab === 'quizzes' && <Quizzes />}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;