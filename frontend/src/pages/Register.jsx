import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Регистрация не должна автоматически логинить пользователя.
            // Иначе (особенно для ADMIN) получается "автовход" без явного логина.
            localStorage.removeItem('token');
            const response = await axios.post('http://localhost:8081/auth/register', {
                email,
                password,
            });
            // НЕ сохраняем token после регистрации — пусть пользователь войдёт вручную.
            if (response?.data?.token) {
                console.warn('Register returned token; ignoring it to avoid auto-login');
            }
            alert('Registration successful! Please log in.');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error(error);
            alert('Registration failed!'+ error.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600"
        >
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-3xl font-bold mb-6 text-purple-600 flex items-center">
                    <FaUser className="mr-2" /> Register
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <div className="flex items-center border rounded-lg p-2">
                            <FaEnvelope className="text-gray-400 mr-2" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700">Password</label>
                        <div className="flex items-center border rounded-lg p-2">
                            <FaLock className="text-gray-400 mr-2" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full outline-none"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-300"
                    >
                        Register
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default Register;