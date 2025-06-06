import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaEdit, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PreferencesForm from './PreferencesForm';
import { toast } from 'react-toastify';

const MovieRecommendations = ({ email }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

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

  const fetchMovieDetails = async (movieId) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      console.debug(`Fetching details for movieId: ${movieId}`);
      const response = await axios.get(
        `http://localhost:8083/api/recommendations/${email}/movies/${movieId}`
      );
      console.debug('Movie details response:', response.data);
      if (!response.data || Object.keys(response.data).length === 0) {
        throw new Error('Empty movie details response');
      }
      setMovieDetails(response.data);
      setDetailsLoading(false);
    } catch (error) {
      console.error(`Error fetching movie details for movieId=${movieId}:`, error);
      setDetailsError(error.message || 'Failed to load movie details');
      setMovieDetails(null);
      setDetailsLoading(false);
      toast.error('Failed to load movie details');
    }
  };

  useEffect(() => {
    if (!email) return;
    checkUserPreferences();
    fetchRecommendations();
  }, [email]);

  useEffect(() => {
    if (!showPreferences && hasPreferences) {
      fetchRecommendations();
    }
  }, [showPreferences]);

  useEffect(() => {
    if (selectedMovie) {
      fetchMovieDetails(selectedMovie.movieId);
    }
  }, [selectedMovie]);

  const handleMarkAsWatched = async (movieId) => {
    try {
      await axios.post(
        `http://localhost:8082/users/${email}/recommendations/${movieId}/watched`
      );
      setRecommendations(prev =>
        prev.map(movie =>
          movie.movieId === movieId ? { ...movie, watched: true } : movie
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
      setLoading(true);
      await axios.post(
        `http://localhost:8082/users/${email}/refresh-recommendations`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchRecommendations(); // No artificial delay
      toast.success('Recommendations refreshed!');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error('Failed to refresh recommendations');
      setLoading(false);
    }
  };

  const handlePreferencesUpdated = async () => {
    setShowPreferences(false);
    setHasPreferences(true);
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8082/users/${email}/recommendations`,
        { timeout: 5000 }
      );
      if (response.data && response.data.length > 0) {
        setRecommendations(response.data);
        setLoading(false);
        toast.success('Preferences saved and recommendations updated!');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchRecommendations();
    } catch (error) {
      console.error('Error after saving preferences:', error);
      await fetchRecommendations();
    }
    setLoading(false);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
    setDetailsError(null);
  };

  if (!hasPreferences && !showPreferences) {
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

  const groupedRecommendations = {
    actors: recommendations.filter(rec => rec.category === 'actors'),
    genres: recommendations.filter(rec => rec.category === 'genres'),
    directors: recommendations.filter(rec => rec.category === 'directors'),
    movies: recommendations.filter(rec => rec.category === 'movies'),
  };

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
        <div className="space-y-12">
          {groupedRecommendations.actors.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Actors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedRecommendations.actors.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.genres.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Genres</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedRecommendations.genres.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.directors.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Directors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedRecommendations.directors.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.movies.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Movies</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedRecommendations.movies.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}
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
              onPreferencesUpdated={handlePreferencesUpdated}
              fetchRecommendations={fetchRecommendations}
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

      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {detailsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : detailsError ? (
              <div className="text-center">
                <p className="text-red-600 mb-4">{detailsError}</p>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            ) : movieDetails ? (
              <div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <img
                    src={
                      movieDetails.posterPath
                        ? `http://localhost:8083/api/recommendations/${email}/movies/${movieDetails.id}/poster`
                        : 'https://via.placeholder.com/300x450?text=No+Image'
                    }
                    alt={movieDetails.title}
                    className="w-full sm:w-1/3 h-auto rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{movieDetails.title}</h2>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Release Date:</span>{' '}
                      {movieDetails.releaseDate || 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Runtime:</span>{' '}
                      {movieDetails.runtime ? `${movieDetails.runtime} minutes` : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Rating:</span>{' '}
                      {movieDetails.voteAverage?.toFixed(1) || 'N/A'} / 10
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Genres:</span>{' '}
                      {movieDetails.genres?.length > 0 ? movieDetails.genres.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Actors:</span>{' '}
                      {movieDetails.actors?.length > 0 ? movieDetails.actors.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Directors:</span>{' '}
                      {movieDetails.directors?.length > 0 ? movieDetails.directors.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-700 mb-4">
                      <span className="font-semibold">Overview:</span>{' '}
                      {movieDetails.overview || 'No description available'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-600 mb-4">No movie details available.</p>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MovieCard = ({ movie, onMarkAsWatched, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <img
        src={
          movie.posterUrl
            ? `http://localhost:8083/api/recommendations/${movie.email}/movies/${movie.movieId}/poster`
            : 'https://via.placeholder.com/500x750?text=No+Image'
        }
        alt={movie.movieTitle}
        className="w-full h-96 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold">{movie.movieTitle}</h3>
          <span className="flex items-center text-yellow-500">
            <FaStar className="mr-1" />
            {movie.rating?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {movie.genres?.trim() ? movie.genres : 'No genres'}
        </p>
        <p className="text-gray-700 mb-4 line-clamp-3">
          {movie.overview || 'No description available'}
        </p>
      </div>
    </motion.div>
  );
};

export default MovieRecommendations;