import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaEdit, FaRedo, FaPlay } from 'react-icons/fa';
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
  const sectionRefs = useRef({ actors: null, genres: null, directors: null, movies: null });

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
    } catch (error) {
      console.error('Error marking as watched:', error);
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
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
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

  const scrollToSection = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionButtons = [
    { key: 'actors', label: 'Actors', hasItems: groupedRecommendations.actors.length > 0 },
    { key: 'genres', label: 'Genres', hasItems: groupedRecommendations.genres.length > 0 },
    { key: 'directors', label: 'Directors', hasItems: groupedRecommendations.directors.length > 0 },
    { key: 'movies', label: 'Movies', hasItems: groupedRecommendations.movies.length > 0 },
  ].filter(b => b.hasItems);

  return (
    <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Your Recommendations</h2>
          {sectionButtons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sectionButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => scrollToSection(key)}
                  className="px-2.5 py-1 text-sm rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefreshRecommendations}
            className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm sm:text-base"
          >
            <FaRedo className="mr-1.5 sm:mr-2 shrink-0" /> Refresh
          </button>
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm sm:text-base"
          >
            <FaEdit className="mr-1.5 sm:mr-2 shrink-0" /> Edit Preferences
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
            <div ref={el => sectionRefs.current.actors = el}>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Actors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch [&>*]:min-w-0">
                {groupedRecommendations.actors.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    email={email}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.genres.length > 0 && (
            <div ref={el => sectionRefs.current.genres = el}>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Genres</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch [&>*]:min-w-0">
                {groupedRecommendations.genres.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    email={email}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.directors.length > 0 && (
            <div ref={el => sectionRefs.current.directors = el}>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Directors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch [&>*]:min-w-0">
                {groupedRecommendations.directors.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    email={email}
                    onMarkAsWatched={handleMarkAsWatched}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedRecommendations.movies.length > 0 && (
            <div ref={el => sectionRefs.current.movies = el}>
              <h3 className="text-xl font-semibold mb-4">Based on Your Favorite Movies</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch [&>*]:min-w-0">
                {groupedRecommendations.movies.map(movie => (
                  <MovieCard
                    key={movie.movieId}
                    movie={movie}
                    email={email}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full my-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <PreferencesForm
              email={email}
              onPreferencesUpdated={handlePreferencesUpdated}
              fetchRecommendations={fetchRecommendations}
            />
            <button
              onClick={() => setShowPreferences(false)}
              className="mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            {detailsLoading ? (
              <div className="flex justify-center items-center min-h-[12rem] sm:h-64">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : detailsError ? (
              <div className="text-center">
                <p className="text-red-600 mb-4 text-sm sm:text-base">{detailsError}</p>
                <button
                  onClick={closeModal}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            ) : movieDetails ? (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <img
                    src={
                      movieDetails.posterPath
                        ? `http://localhost:8083/api/recommendations/${email}/movies/${movieDetails.id}/poster`
                        : 'https://via.placeholder.com/300x450?text=No+Image'
                    }
                    alt={movieDetails.title}
                    className="w-full sm:w-1/3 max-w-xs mx-auto sm:mx-0 h-auto rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 break-words">{movieDetails.title}</h2>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Release Date:</span>{' '}
                      {movieDetails.releaseDate || 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Runtime:</span>{' '}
                      {movieDetails.runtime ? `${movieDetails.runtime} minutes` : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Rating:</span>{' '}
                      {movieDetails.voteAverage?.toFixed(1) || 'N/A'} / 10
                    </p>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Genres:</span>{' '}
                      {movieDetails.genres?.length > 0 ? movieDetails.genres.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Actors:</span>{' '}
                      {movieDetails.actors?.length > 0 ? movieDetails.actors.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-1.5 sm:mb-2 text-sm sm:text-base">
                      <span className="font-semibold">Directors:</span>{' '}
                      {movieDetails.directors?.length > 0 ? movieDetails.directors.join(', ') : 'N/A'}
                    </p>
                    <p className="text-gray-700 mb-4 text-sm sm:text-base">
                      <span className="font-semibold">Overview:</span>{' '}
                      {movieDetails.overview || 'No description available'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={closeModal}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-600 mb-4 text-sm sm:text-base">No movie details available.</p>
                <button
                  onClick={closeModal}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
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

const MovieCard = ({ movie, email, onMarkAsWatched, onClick }) => {
  const navigate = useNavigate();

  const handleWatch = (e) => {
    e.stopPropagation();
    navigate(`/watch/${movie.movieId}?email=${encodeURIComponent(email)}`);
  };

  const posterSrc = (email != null && movie.movieId != null)
    ? `http://localhost:8083/api/recommendations/${email}/movies/${movie.movieId}/poster`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer flex flex-col w-full min-w-0"
      onClick={onClick}
    >
      <div className="relative w-full aspect-[2/3] flex-shrink-0 overflow-hidden bg-gray-200">
        <img
          src={posterSrc}
          alt={movie.movieTitle}
          className="w-full h-full object-cover object-center"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/500x750?text=No+Image'; }}
        />
        <div className="absolute inset-x-0 bottom-2 flex justify-center z-10">
          <button
            onClick={handleWatch}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center transition shadow-lg text-xs sm:text-sm"
          >
            <FaPlay className="mr-1.5 sm:mr-2 shrink-0" />
            Watch
          </button>
        </div>
      </div>
      <div className="flex-shrink-0 min-h-[4.5rem] overflow-hidden p-2 sm:p-3 flex flex-col min-w-0 border-t border-gray-100">
        <div className="flex justify-between items-center gap-2 min-w-0 mb-0.5">
          <h3 className="text-sm sm:text-base font-bold truncate min-w-0" title={movie.movieTitle}>{movie.movieTitle}</h3>
          <span className="flex items-center text-yellow-500 shrink-0 text-sm">
            <FaStar className="mr-1" />
            {movie.rating?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <p className="text-gray-600 text-sm truncate min-w-0" title={movie.genres?.trim() || 'No genres'}>
          {movie.genres?.trim() ? movie.genres : 'No genres'}
        </p>
        <p className="text-gray-700 text-sm line-clamp-2 min-w-0 mt-0.5 leading-tight" title={movie.overview || 'No description available'}>
          {movie.overview || 'No description available'}
        </p>
      </div>
    </motion.div>
  );
};

export default MovieRecommendations;