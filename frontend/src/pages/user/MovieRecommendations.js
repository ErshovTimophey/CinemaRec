// MovieRecommendations.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaHeart, FaEye, FaEdit, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PreferencesForm from './PreferencesForm';
import { toast } from 'react-toastify';

const MovieRecommendations = ({ email }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8082/users/${email}/recommendations`
      );
      setRecommendations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
      setLoading(false);
    }
  };

  const checkUserPreferences = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8082/users/${email}/preferences`
      );
      setHasPreferences(response.data !== null);
    } catch (error) {
      console.error('Error checking preferences:', error);
      setHasPreferences(false);
    }
  };

  useEffect(() => {
    checkUserPreferences();
    fetchRecommendations();
  }, [email]);

  const handleMarkAsWatched = async (movieId) => {
    try {
      await axios.post(
        `http://localhost:8082/users/${email}/watched-movies`,
        { movieId }
      );
      setRecommendations(prev =>
        prev.map(movie =>
          movie.id === movieId ? { ...movie, watched: true } : movie
        )
      );
      toast.success('Marked as watched!');
    } catch (error) {
      console.error('Error marking as watched:', error);
      toast.error('Failed to update');
    }
  };

  const handleRefreshRecommendations = async () => {
    try {
      await axios.post(
        `http://localhost:8082/users/${email}/refresh-recommendations`
      );
      fetchRecommendations();
      toast.success('Recommendations refreshed!');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error('Failed to refresh recommendations');
    }
  };

  if (!hasPreferences) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to CinemaRec!</h2>
          <p className="text-lg mb-6">
            To get personalized movie recommendations, please set your preferences first.
          </p>
          <button
            onClick={() => setShowPreferences(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Set Preferences
          </button>
        </div>

        {showPreferences && (
          <div className="mt-6">
            <PreferencesForm
              email={email}
              onPreferencesUpdated={() => {
                setShowPreferences(false);
                setHasPreferences(true);
                fetchRecommendations();
              }}
            />
          </div>
        )}
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Recommendations</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshRecommendations}
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            <FaRedo className="mr-2" /> Refresh
          </button>
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            <FaEdit className="mr-2" /> Edit Preferences
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-lg">No recommendations found based on your preferences.</p>
          <button
            onClick={() => setShowPreferences(true)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Adjust Preferences
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onMarkAsWatched={handleMarkAsWatched}
            />
          ))}
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-y-auto"
          >
            <PreferencesForm
              email={email}
              onPreferencesUpdated={() => {
                setShowPreferences(false);
                fetchRecommendations();
              }}
            />
            <button
              onClick={() => setShowPreferences(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MovieCard = ({ movie, onMarkAsWatched }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-lg overflow-hidden shadow-lg"
    >
      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image'
        }
        alt={movie.title}
        className="w-full h-96 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold">{movie.title}</h3>
          <span className="flex items-center text-yellow-500">
            <FaStar className="mr-1" />
            {movie.vote_average?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {movie.genres?.join(', ') || 'No genres'}
        </p>
        <p className="text-gray-700 mb-4 line-clamp-3">
          {movie.overview || 'No description available'}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => onMarkAsWatched(movie.id)}
            className={`flex items-center px-3 py-1 rounded ${
              movie.watched
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
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
  );
};

export default MovieRecommendations;