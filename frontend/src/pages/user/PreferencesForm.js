import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaFilm, FaUser, FaStar, FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA'
  }
});

const PreferencesForm = ({ email, onPreferencesUpdated }) => {
  // Состояния
  const [genres, setGenres] = useState([]);
  const [actors, setActors] = useState([]);
  const [movies, setMovies] = useState([]);
  const [minRating, setMinRating] = useState(7);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [actorSearchResults, setActorSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('genres');
  const [selectedMovieObjects, setSelectedMovieObjects] = useState([]);
  const [selectedActorObjects, setSelectedActorObjects] = useState([]);

  // Пагинация
  const [currentActorPage, setCurrentActorPage] = useState(1);
  const [totalActorPages, setTotalActorPages] = useState(1);
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const [totalMoviePages, setTotalMoviePages] = useState(1);

  // Флаги для отображения результатов поиска
  const [showActorSearchResults, setShowActorSearchResults] = useState(false);
  const [showMovieSearchResults, setShowMovieSearchResults] = useState(false);

  useEffect(() => {
    if (!email) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        const [genresRes, actorsRes, moviesRes, preferencesRes] = await Promise.all([
          tmdbApi.get('/genre/movie/list'),
          tmdbApi.get('/person/popular?page=1'),
          tmdbApi.get('/movie/popular?page=1'),
          axios.get(`http://localhost:8082/users/${email}/preferences`)
        ]);

        setGenres(genresRes.data.genres);
        setActors(actorsRes.data.results);
        setTotalActorPages(actorsRes.data.total_pages || 1);
        setMovies(moviesRes.data.results);
        setTotalMoviePages(moviesRes.data.total_pages || 1);

        if (preferencesRes.data) {
          const prefs = preferencesRes.data;
          setSelectedGenres(prefs.favoriteGenres?.map(id => Number(id)) || []);
          setSelectedActors(prefs.favoriteActors?.map(id => Number(id)) || []);
          setSelectedMovies(prefs.favoriteMovies?.map(id => Number(id)) || []);
          setMinRating(prefs.minRating || 7);

          // Загружаем полные данные выбранных фильмов и актеров
          const [movieRequests, actorRequests] = await Promise.all([
            Promise.all(
              prefs.favoriteMovies?.map(id =>
                tmdbApi.get(`/movie/${id}`).then(res => res.data).catch(() => null)
              ) || []
            ),
            Promise.all(
              prefs.favoriteActors?.map(id =>
                tmdbApi.get(`/person/${id}`).then(res => res.data).catch(() => null)
              ) || []
            )
          ]);


          setSelectedMovieObjects(movieRequests.filter(m => m !== null));
          setSelectedActorObjects(actorRequests.filter(a => a !== null));
        }
      } catch (error) {
        toast.error('Failed to load initial data');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [email]);

  // Поиск фильмов
  const handleMovieSearch = async () => {
    if (!movieSearchQuery.trim()) {
      setShowMovieSearchResults(false);
      return;
    }

    try {
      const response = await tmdbApi.get(`/search/movie?query=${movieSearchQuery}`);
      setMovieSearchResults(response.data.results);
      setShowMovieSearchResults(true);
    } catch (error) {
      toast.error('Failed to search movies');
    }
  };

  // Поиск актеров
  const handleActorSearch = async () => {
    if (!actorSearchQuery.trim()) {
      setShowActorSearchResults(false);
      return;
    }

    try {
      const response = await tmdbApi.get(`/search/person?query=${actorSearchQuery}`);
      setActorSearchResults(response.data.results);
      setShowActorSearchResults(true);
    } catch (error) {
      toast.error('Failed to search actors');
    }
  };

  // Пагинация актеров
  const fetchActorPage = async (page) => {
    try {
      const response = await tmdbApi.get(`/person/popular?page=${page}`);
      setActors(response.data.results);
      setCurrentActorPage(page);
    } catch (error) {
      toast.error('Failed to load actors');
    }
  };

  // Пагинация фильмов
  const fetchMoviePage = async (page) => {
    try {
      const response = await tmdbApi.get(`/movie/popular?page=${page}`);
      setMovies(response.data.results);
      setCurrentMoviePage(page);
    } catch (error) {
      toast.error('Failed to load movies');
    }
  };

  // Обработчики изменений
  const handleGenreChange = (genreId, isChecked) => {
    setSelectedGenres(prev =>
      isChecked ? [...prev, genreId] : prev.filter(id => id !== genreId)
    );
  };

  const handleActorChange = (actorId, isChecked) => {
    setSelectedActors(prev =>
      isChecked ? [...prev, actorId] : prev.filter(id => id !== actorId)
    );

    if (isChecked) {
      const actor = actorSearchResults.find(a => a.id === actorId) ||
                   actors.find(a => a.id === actorId);
      if (actor && !selectedActorObjects.some(a => a.id === actorId)) {
        setSelectedActorObjects(prev => [...prev, actor]);
      }
    } else {
      setSelectedActorObjects(prev => prev.filter(a => a.id !== actorId));
    }
  };

  const handleMovieChange = (movieId, isChecked) => {
    setSelectedMovies(prev =>
      isChecked ? [...prev, movieId] : prev.filter(id => id !== movieId)
    );

    if (isChecked) {
      const movie = movieSearchResults.find(m => m.id === movieId) ||
                   movies.find(m => m.id === movieId);
      if (movie && !selectedMovieObjects.some(m => m.id === movieId)) {
        setSelectedMovieObjects(prev => [...prev, movie]);
      }
    } else {
      setSelectedMovieObjects(prev => prev.filter(m => m.id !== movieId));
    }
  };

  const handleSavePreferences = async () => {
    try {
      const preferences = {
        favoriteGenres: selectedGenres,
        favoriteActors: selectedActors,
        favoriteMovies: selectedMovies,
        minRating: minRating
      };

      await axios.put(
        `http://localhost:8082/users/${email}/preferences`,
        preferences
      );

      toast.success('Preferences updated successfully!');
      if (onPreferencesUpdated) onPreferencesUpdated();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const displayedActors = showActorSearchResults ? actorSearchResults : actors;
  const displayedMovies = showMovieSearchResults ? movieSearchResults : movies;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FaFilm className="mr-2" /> Your Preferences
      </h2>

      <div className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('genres')}
            className={`px-4 py-2 ${activeTab === 'genres' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}
          >
            Genres
          </button>
          <button
            onClick={() => setActiveTab('actors')}
            className={`px-4 py-2 ${activeTab === 'actors' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}
          >
            Actors
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 ${activeTab === 'movies' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('rating')}
            className={`px-4 py-2 ${activeTab === 'rating' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}
          >
            Rating
          </button>
        </div>
      </div>

      {activeTab === 'genres' && (
        <div className="mb-6">
          <label className="block text-lg mb-2 flex items-center">
            <FaFilm className="mr-2" /> Favorite Genres (Select at least 3)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {genres.map(genre => (
              <label
                key={genre.id}
                className={`flex items-center space-x-2 p-2 border rounded transition ${
                  selectedGenres.includes(genre.id)
                    ? 'bg-purple-100 border-purple-500'
                    : 'hover:bg-purple-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.id)}
                  onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>{genre.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'actors' && (
        <div className="mb-6">
          <label className="block text-lg mb-2 flex items-center">
            <FaUser className="mr-2" /> Favorite Actors (Select up to 5)
          </label>

          <div className="flex mb-4">
            <input
              type="text"
              value={actorSearchQuery}
              onChange={(e) => setActorSearchQuery(e.target.value)}
              placeholder="Search for actors..."
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleActorSearch}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition"
            >
              <FaSearch className="mr-2" /> Search
            </button>
            {showActorSearchResults && (
              <button
                onClick={() => {
                  setShowActorSearchResults(false);
                  setActorSearchQuery('');
                }}
                className="flex items-center px-4 py-2 ml-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                <FaTimes className="mr-2" /> Back to Popular
              </button>
            )}
          </div>

          {!showActorSearchResults && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => fetchActorPage(currentActorPage - 1)}
                disabled={currentActorPage <= 1}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <FaChevronLeft className="mr-1" /> Previous
              </button>
              <span className="text-gray-600">
                Page {currentActorPage} of {totalActorPages}
              </span>
              <button
                onClick={() => fetchActorPage(currentActorPage + 1)}
                disabled={currentActorPage >= totalActorPages}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next <FaChevronRight className="ml-1" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedActors.map(actor => (
              <label
                key={actor.id}
                className={`flex flex-col items-center p-2 border rounded transition ${
                  selectedActors.includes(actor.id)
                    ? 'bg-purple-100 border-purple-500'
                    : 'hover:bg-purple-50'
                }`}
              >
                <img
                  src={
                    actor.profile_path
                      ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                      : 'https://via.placeholder.com/200x300?text=No+Image'
                  }
                  alt={actor.name}
                  className="w-24 h-24 rounded-full object-cover mb-2"
                />
                <input
                  type="checkbox"
                  checked={selectedActors.includes(actor.id)}
                  onChange={(e) => handleActorChange(actor.id, e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-center">{actor.name}</span>
              </label>
            ))}
          </div>

          {selectedActorObjects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Selected Actors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedActorObjects.map(actor => (
                  <div key={actor.id} className="relative flex flex-col items-center p-2 border rounded">
                    <button
                      onClick={() => {
                        setSelectedActors(prev => prev.filter(id => id !== actor.id));
                        setSelectedActorObjects(prev => prev.filter(a => a.id !== actor.id));
                      }}
                      className="absolute top-1 right-1 text-gray-600 hover:text-red-600 focus:outline-none"
                      aria-label={`Remove ${actor.name}`}
                      style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      ✕
                    </button>
                    <img
                      src={actor.profile_path
                        ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                        : 'https://via.placeholder.com/200x300?text=No+Image'}
                      alt={actor.name}
                      className="w-24 h-24 rounded-full object-cover mb-2"
                    />
                    <span className="text-center text-sm">{actor.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'movies' && (
        <div className="mb-6">
          <label className="block text-lg mb-2 flex items-center">
            <FaFilm className="mr-2" /> Favorite Movies (Select at least 3)
          </label>

          <div className="flex mb-4">
            <input
              type="text"
              value={movieSearchQuery}
              onChange={(e) => setMovieSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleMovieSearch}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition"
            >
              <FaSearch className="mr-2" /> Search
            </button>
            {showMovieSearchResults && (
              <button
                onClick={() => {
                  setShowMovieSearchResults(false);
                  setMovieSearchQuery('');
                }}
                className="flex items-center px-4 py-2 ml-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                <FaTimes className="mr-2" /> Back to Popular
              </button>
            )}
          </div>

          {!showMovieSearchResults && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => fetchMoviePage(currentMoviePage - 1)}
                disabled={currentMoviePage <= 1}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <FaChevronLeft className="mr-1" /> Previous
              </button>
              <span className="text-gray-600">
                Page {currentMoviePage} of {totalMoviePages}
              </span>
              <button
                onClick={() => fetchMoviePage(currentMoviePage + 1)}
                disabled={currentMoviePage >= totalMoviePages}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next <FaChevronRight className="ml-1" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedMovies.map(movie => (
              <label
                key={movie.id}
                className={`flex flex-col items-center p-2 border rounded transition ${
                  selectedMovies.includes(movie.id)
                    ? 'bg-purple-100 border-purple-500'
                    : 'hover:bg-purple-50'
                }`}
              >
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : 'https://via.placeholder.com/200x300?text=No+Image'
                  }
                  alt={movie.title}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
                <input
                  type="checkbox"
                  checked={selectedMovies.includes(movie.id)}
                  onChange={(e) => handleMovieChange(movie.id, e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-center text-sm mt-1">{movie.title}</span>
              </label>
            ))}
          </div>

          {selectedMovieObjects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Selected Movies</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedMovieObjects.map(movie => (
                  <div key={movie.id} className="relative flex flex-col items-center p-2 border rounded">
                    <button
                      onClick={() => {
                        setSelectedMovies(prev => prev.filter(id => id !== movie.id));
                        setSelectedMovieObjects(prev => prev.filter(m => m.id !== movie.id));
                      }}
                      className="absolute top-1 right-1 text-gray-600 hover:text-red-600 focus:outline-none"
                      aria-label={`Remove ${movie.title}`}
                      style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      ✕
                    </button>
                    <img
                      src={movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                        : 'https://via.placeholder.com/200x300?text=No+Image'}
                      alt={movie.title}
                      className="w-full h-40 object-cover mb-2 rounded"
                    />
                    <span className="text-center text-sm">{movie.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rating' && (
        <div className="mb-6">
          <label className="block text-lg mb-2 flex items-center">
            <FaStar className="mr-2" /> Minimum Rating
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-64 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xl font-bold">{minRating}/10</span>
          </div>
          <p className="text-gray-600 mt-2">
            Only show movies with rating higher than {minRating}
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => {
            if (activeTab === 'genres') setActiveTab('actors');
            else if (activeTab === 'actors') setActiveTab('movies');
            else if (activeTab === 'movies') setActiveTab('rating');
          }}
          className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
          disabled={activeTab === 'rating'}
        >
          Next
        </button>

        <button
          onClick={handleSavePreferences}
          disabled={
            (activeTab === 'genres' && selectedGenres.length < 3) ||
            (activeTab === 'actors' && selectedActors.length === 0) ||
            (activeTab === 'movies' && selectedMovies.length < 3)
          }
          className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSave className="mr-2" /> Save Preferences
        </button>
      </div>
    </motion.div>
  );
};

export default PreferencesForm;