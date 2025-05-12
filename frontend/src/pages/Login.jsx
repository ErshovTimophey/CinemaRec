import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8081/auth/login', {
                email,
                password,
            });

            localStorage.setItem('token', response.data.token);

            // Decode token to check user role
            const decoded = jwt_decode(response.data.token);
            const userRole = decoded.role;

            toast.success(`Login successful as ${userRole === 'ADMIN' ? 'Admin' : 'User'}!`, {
                position: "top-right",
                autoClose: 3000,
            });

            // Redirect based on role
            if (userRole === 'ADMIN') {
                navigate('/admin/dashboard'); // Redirect to admin dashboard
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error(error);
            toast.error('Login failed. Please check your credentials.', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwt_decode(credentialResponse.credential);
            const { email, name } = decoded;

            const response = await axios.post('http://localhost:8081/auth/google', {
                email,
                name,
            });

            localStorage.setItem('token', response.data.token);

            const role = jwt_decode(response.data.token).role;
            toast.success(`Google login successful as ${role === 'ADMIN' ? 'Admin' : 'User'}!`, {
                position: "top-right",
                autoClose: 3000,
            });

            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error('Google login error:', error);
            toast.error('Google login failed. Please try again.' + error.message, {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleGoogleFailure = (error) => {
        toast.error('Google login failed. Please try again.${error.message}', {
            position: "top-right",
            autoClose: 3000,
        });
    };

    return (
        <GoogleOAuthProvider clientId="25429167859-pvf18a2lh4f0nsrplrt4ftahqf6df0q1.apps.googleusercontent.com">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600"
            >
                <ToastContainer />
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-3xl font-bold mb-6 text-purple-600 flex items-center">
                        <FaLock className="mr-2" /> Login
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700">Email</label>
                            <div className={`flex items-center border rounded-lg p-2 ${emailError ? 'border-red-500' : ''}`}>
                                <FaEnvelope className="text-gray-400 mr-2" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className="w-full outline-none"
                                    required
                                />
                            </div>
                            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
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
                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-300 mb-4"
                        >
                            Login
                        </button>

                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="mx-4 text-gray-500">or</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleFailure}
                                render={(renderProps) => (
                                    <button
                                        onClick={renderProps.onClick}
                                        disabled={renderProps.disabled}
                                        className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 hover:bg-gray-50 transition duration-300"
                                    >
                                        <FaGoogle className="text-red-500 mr-2" />
                                        Continue with Google
                                    </button>
                                )}
                            />
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <a href="/register" className="text-purple-600 hover:underline">
                                    Register
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </GoogleOAuthProvider>
    );
};

export default Login;