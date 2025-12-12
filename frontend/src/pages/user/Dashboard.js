import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import MovieRecommendations from './MovieRecommendations';
import Statistics from './Statistics';
import Reviews from './Reviews';
import Quizzes from './Quizzes';
import jwt_decode from 'jwt-decode';

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'recommendations';

    const token = localStorage.getItem('token');
    let email = null;

    if (token) {
        try {
            const decoded = jwt_decode(token);
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
            <div className="w-full pt-2 px-4 pb-4 sm:pt-4 sm:px-6 sm:pb-6 lg:pt-4 lg:px-8 lg:pb-8">
                {activeTab === 'recommendations' && email && <MovieRecommendations email={email} />}
                {activeTab === 'statistics' && email && <Statistics email={email} />}
                {activeTab === 'reviews' && email && <Reviews email={email} />}
                {activeTab === 'quizzes' && email && <Quizzes email={email} />}
            </div>
        </motion.div>
    );
};

export default Dashboard;
