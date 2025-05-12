import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaStar, FaHeart, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MovieRecommendations = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        genres: [],
        actors: [],
        minRating: 7
    });

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8083/movies/recommendations', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        genres: preferences.genres.join(','),
                        actors: preferences.actors.join(','),
                        minRating: preferences.minRating
                    }
                });
                setMovies(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [preferences]);

    const handleMarkAsWatched = async (movieId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8083/movies/watched', { movieId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Обновляем список фильмов
            setMovies(movies.map(movie =>
                movie.id === movieId ? { ...movie, watched: true } : movie
            ));
        } catch (error) {
            console.error('Error marking as watched:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Your Preferences</h3>
                {/* Здесь будет форма для выбора предпочтений */}
            </div>

            <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map(movie => (
                    <motion.div
                        key={movie.id}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg overflow-hidden shadow-lg"
                    >
                        <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-64 object-cover"
                        />
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold">{movie.title}</h3>
                                <span className="flex items-center text-yellow-500">
                                    <FaStar className="mr-1" />
                                    {movie.rating}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">{movie.genres.join(', ')}</p>
                            <p className="text-gray-700 mb-4 line-clamp-3">{movie.description}</p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleMarkAsWatched(movie.id)}
                                    className={`flex items-center px-3 py-1 rounded ${movie.watched ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}`}
                                >
                                    <FaEye className="mr-1" />
                                    {movie.watched ? 'Watched' : 'Mark as watched'}
                                </button>
                                <button className="flex items-center px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200">
                                    <FaHeart className="mr-1" />
                                    Like
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MovieRecommendations;