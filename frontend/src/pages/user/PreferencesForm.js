import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaFilm, FaUser, FaStar, FaSearch, FaChevronLeft, FaChevronRight, FaTimes, FaUserTie } from 'react-icons/fa';
import { motion } from 'framer-motion';

const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA'
  }
});

const PreferencesForm = ({ email, onPreferencesUpdated, fetchRecommendations }) => {
  // Состояния
  const [genres, setGenres] = useState([]);
  const [actors, setActors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [movies, setMovies] = useState([]);
  const [minRating, setMinRating] = useState(7);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [directorSearchQuery, setDirectorSearchQuery] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [actorSearchResults, setActorSearchResults] = useState([]);
  const [directorSearchResults, setDirectorSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('genres');
  const [selectedMovieObjects, setSelectedMovieObjects] = useState([]);
  const [selectedActorObjects, setSelectedActorObjects] = useState([]);
  const [selectedDirectorObjects, setSelectedDirectorObjects] = useState([]);

  // Пагинация
  const [currentActorPage, setCurrentActorPage] = useState(1);
  const [totalActorPages, setTotalActorPages] = useState(1);
  const [currentDirectorPage, setCurrentDirectorPage] = useState(1);
  const [totalDirectorPages, setTotalDirectorPages] = useState(1);
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const [totalMoviePages, setTotalMoviePages] = useState(1);
  const [allActors, setAllActors] = useState([]);
  const [allDirectors, setAllDirectors] = useState([]);
  const [allMovies, setAllMovies] = useState([]);

  // Флаги для отображения результатов поиска
  const [showActorSearchResults, setShowActorSearchResults] = useState(false);
  const [showDirectorSearchResults, setShowDirectorSearchResults] = useState(false);
  const [showMovieSearchResults, setShowMovieSearchResults] = useState(false);

  // Количество элементов на странице
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (!email) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching initial data for email:", email);

        const genresRes = await tmdbApi.get('/genre/movie/list');

        let allFetchedActors = [];
        let allFetchedDirectors = [];
        let allFetchedMovies = [];
        const maxTmdbPages = 10;
        for (let page = 1; page <= maxTmdbPages; page++) {
          const personsRes = await tmdbApi.get(`/person/popular?page=${page}`);
          const actors = personsRes.data.results.filter(person => person.known_for_department === 'Acting');
          const directors = personsRes.data.results.filter(person => person.known_for_department === 'Directing');
          allFetchedActors = [...allFetchedActors, ...actors];
          allFetchedDirectors = [...allFetchedDirectors, ...directors];
        }
        for (let page = 1; page <= maxTmdbPages; page++) {
          const moviesRes = await tmdbApi.get(`/movie/popular?page=${page}`);
          allFetchedMovies = [...allFetchedMovies, ...moviesRes.data.results];
        }

        allFetchedActors = Array.from(new Map(allFetchedActors.map(a => [a.id, a])).values());
        allFetchedDirectors = Array.from(new Map(allFetchedDirectors.map(d => [d.id, d])).values());
        allFetchedMovies = Array.from(new Map(allFetchedMovies.map(m => [m.id, m])).values());

        setGenres(genresRes.data.genres);
        setAllActors(allFetchedActors);
        setActors(allFetchedActors.slice(0, ITEMS_PER_PAGE));
        setTotalActorPages(Math.ceil(allFetchedActors.length / ITEMS_PER_PAGE));
        setAllDirectors(allFetchedDirectors);
        setDirectors(allFetchedDirectors.slice(0, ITEMS_PER_PAGE));
        setTotalDirectorPages(Math.ceil(allFetchedDirectors.length / ITEMS_PER_PAGE));
        setAllMovies(allFetchedMovies);
        setMovies(allFetchedMovies.slice(0, ITEMS_PER_PAGE));
        setTotalMoviePages(Math.ceil(allFetchedMovies.length / ITEMS_PER_PAGE));

        try {
          const preferencesRes = await axios.get(`http://localhost:8082/users/${email}/preferences`);
          const prefs = preferencesRes.data;
          console.log("Loaded preferences:", prefs);

          setSelectedGenres(prefs.favoriteGenres?.map(id => Number(id)) || []);
          setSelectedActors(prefs.favoriteActors?.map(id => Number(id)) || []);
          setSelectedDirectors(prefs.favoriteDirectors?.map(id => Number(id)) || []);
          setSelectedMovies(prefs.favoriteMovies?.map(id => Number(id)) || []);
          setMinRating(prefs.minRating || 7);

          const moviePromises = prefs.favoriteMovies?.map(id =>
            tmdbApi.get(`/movie/${id}`).then(res => res.data).catch(() => null)) || [];
          const actorPromises = prefs.favoriteActors?.map(id =>
            tmdbApi.get(`/person/${id}`).then(res => res.data).catch(() => null)) || [];
          const directorPromises = prefs.favoriteDirectors?.map(id =>
            tmdbApi.get(`/person/${id}`).then(res => res.data).catch(() => null)) || [];

          const [movieResults, actorResults, directorResults] = await Promise.all([
            Promise.all(moviePromises),
            Promise.all(actorPromises),
            Promise.all(directorPromises)
          ]);

          setSelectedMovieObjects(movieResults.filter(m => m).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
          setSelectedActorObjects(actorResults.filter(a => a && a.known_for_department === 'Acting').filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
          setSelectedDirectorObjects(directorResults.filter(d => d && d.known_for_department === 'Directing').filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
        } catch (prefError) {
          console.warn("No preferences found or failed to load preferences:", prefError);
          setSelectedGenres([]);
          setSelectedActors([]);
          setSelectedDirectors([]);
          setSelectedMovies([]);
          setMinRating(7);
          setSelectedMovieObjects([]);
          setSelectedActorObjects([]);
          setSelectedDirectorObjects([]);
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

  // Поиск актёров
  const handleActorSearch = async () => {
    if (!actorSearchQuery.trim()) {
      setShowActorSearchResults(false);
      return;
    }
    try {
      const response = await tmdbApi.get(`/search/person?query=${actorSearchQuery}`);
      setActorSearchResults(response.data.results.filter(person => person.known_for_department === 'Acting'));
      setShowActorSearchResults(true);
    } catch (error) {
      toast.error('Failed to search actors');
    }
  };

  // Поиск режиссёров
  const handleDirectorSearch = async () => {
    if (!directorSearchQuery.trim()) {
      setShowDirectorSearchResults(false);
      return;
    }
    try {
      const response = await tmdbApi.get(`/search/person?query=${directorSearchQuery}`);
      setDirectorSearchResults(response.data.results.filter(person => person.known_for_department === 'Directing'));
      setShowDirectorSearchResults(true);
    } catch (error) {
      toast.error('Failed to search directors');
    }
  };

  // Пагинация актёров
  const fetchActorPage = async (page) => {
    try {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      if (endIndex > allActors.length) {
        const additionalPages = 5;
        let newActors = [...allActors];
        for (let i = 1; i <= additionalPages; i++) {
          const nextPage = Math.ceil(allActors.length / 20) + i;
          if (nextPage > 500) break;
          const response = await tmdbApi.get(`/person/popular?page=${nextPage}`);
          const filteredActors = response.data.results.filter(person => person.known_for_department === 'Acting');
          newActors = [...newActors, ...filteredActors];
        }
        newActors = Array.from(new Map(newActors.map(a => [a.id, a])).values());
        setAllActors(newActors);
        setTotalActorPages(Math.ceil(newActors.length / ITEMS_PER_PAGE));
      }
      setActors(allActors.slice(startIndex, endIndex));
      setCurrentActorPage(page);
    } catch (error) {
      toast.error('Failed to load actors');
      console.error(error);
    }
  };

  // Пагинация режиссёров
  const fetchDirectorPage = async (page) => {
    try {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      if (endIndex > allDirectors.length) {
        const additionalPages = 5;
        let newDirectors = [...allDirectors];
        for (let i = 1; i <= additionalPages; i++) {
          const nextPage = Math.ceil(allDirectors.length / 20) + i;
          if (nextPage > 500) break;
          const response = await tmdbApi.get(`/person/popular?page=${nextPage}`);
          const filteredDirectors = response.data.results.filter(person => person.known_for_department === 'Directing');
          newDirectors = [...newDirectors, ...filteredDirectors];
        }
        newDirectors = Array.from(new Map(newDirectors.map(d => [d.id, d])).values());
        setAllDirectors(newDirectors);
        setTotalDirectorPages(Math.ceil(newDirectors.length / ITEMS_PER_PAGE));
      }
      setDirectors(allDirectors.slice(startIndex, endIndex));
      setCurrentDirectorPage(page);
    } catch (error) {
      toast.error('Failed to load directors');
      console.error(error);
    }
  };

  // Пагинация фильмов
  const fetchMoviePage = async (page) => {
    try {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      if (endIndex > allMovies.length) {
        const additionalPages = 5;
        let newMovies = [...allMovies];
        for (let i = 1; i <= additionalPages; i++) {
          const nextPage = Math.ceil(allMovies.length / 20) + i;
          if (nextPage > 500) break;
          const response = await tmdbApi.get(`/movie/popular?page=${nextPage}`);
          newMovies = [...newMovies, ...response.data.results];
        }
        newMovies = Array.from(new Map(newMovies.map(m => [m.id, m])).values());
        setAllMovies(newMovies);
        setTotalMoviePages(Math.ceil(newMovies.length / ITEMS_PER_PAGE));
      }
      setMovies(allMovies.slice(startIndex, endIndex));
      setCurrentMoviePage(page);
    } catch (error) {
      toast.error('Failed to load movies');
      console.error(error);
    }
  };

  // Обработчики изменений
  const handleGenreChange = (genreId, isChecked) => {
    setSelectedGenres(prev =>
      isChecked ? [...prev, genreId] : prev.filter(id => id !== genreId));
  };

  const handleActorChange = (actorId, isChecked) => {
    setSelectedActors(prev =>
      isChecked ? [...prev, actorId] : prev.filter(id => id !== actorId));
    if (isChecked) {
      const actor = [...actorSearchResults, ...actors].find(a => a.id === actorId);
      if (actor && !selectedActorObjects.find(a => a.id === actorId)) {
        setSelectedActorObjects(prev => [...prev, actor]);
      }
    } else {
      setSelectedActorObjects(prev => prev.filter(a => a.id !== actorId));
    }
  };

  const handleDirectorChange = (directorId, isChecked) => {
    setSelectedDirectors(prev =>
      isChecked ? [...prev, directorId] : prev.filter(id => id !== directorId));
    if (isChecked) {
      const director = [...directorSearchResults, ...directors].find(d => d.id === directorId);
      if (director && !selectedDirectorObjects.find(d => d.id === directorId)) {
        setSelectedDirectorObjects(prev => [...prev, director]);
      }
    } else {
      setSelectedDirectorObjects(prev => prev.filter(d => d.id !== directorId));
    }
  };

  const handleMovieChange = (movieId, isChecked) => {
    setSelectedMovies(prev =>
      isChecked ? [...prev, movieId] : prev.filter(id => id !== movieId));
    if (isChecked) {
      const movie = [...movieSearchResults, ...movies].find(m => m.id === movieId);
      if (movie && !selectedMovieObjects.find(m => m.id === movieId)) {
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
        favoriteDirectors: selectedDirectors,
        favoriteMovies: selectedMovies,
        minRating: minRating
      };
      console.log("Saving preferences:", preferences);
      const response = await axios.put(
        `http://localhost:8082/users/${email}/preferences`,
        preferences
      );
      console.log("Save preferences response:", response.data);
      toast.success('Preferences updated successfully!');
      if (onPreferencesUpdated) {
        console.log("Triggering onPreferencesUpdated callback");
        await onPreferencesUpdated();
      }
      // Обновляем рекомендации после сохранения предпочтений
      await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка 1 сек
      await fetchRecommendations();
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
  const displayedDirectors = showDirectorSearchResults ? directorSearchResults : directors;
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
            onClick={() => setActiveTab('directors')}
            className={`px-4 py-2 ${activeTab === 'directors' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-600'}`}
          >
            Directors
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

      {activeTab === 'directors' && (
        <div className="mb-6">
          <label className="block text-lg mb-2 flex items-center">
            <FaUserTie className="mr-2" /> Favorite Directors (Select up to 5)
          </label>
          <div className="flex mb-4">
            <input
              type="text"
              value={directorSearchQuery}
              onChange={(e) => setDirectorSearchQuery(e.target.value)}
              placeholder="Search for directors..."
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleDirectorSearch}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition"
            >
              <FaSearch className="mr-2" /> Search
            </button>
            {showDirectorSearchResults && (
              <button
                onClick={() => {
                  setShowDirectorSearchResults(false);
                  setDirectorSearchQuery('');
                }}
                className="flex items-center px-4 py-2 ml-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                <FaTimes className="mr-2" /> Back to Popular
              </button>
            )}
          </div>
          {!showDirectorSearchResults && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => fetchDirectorPage(currentDirectorPage - 1)}
                disabled={currentDirectorPage <= 1}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <FaChevronLeft className="mr-1" /> Previous
              </button>
              <span className="text-gray-600">
                Page {currentDirectorPage} of {totalDirectorPages}
              </span>
              <button
                onClick={() => fetchDirectorPage(currentDirectorPage + 1)}
                disabled={currentDirectorPage >= totalDirectorPages}
                className="flex items-center px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next <FaChevronRight className="ml-1" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedDirectors.map(director => (
              <label
                key={director.id}
                className={`flex flex-col items-center p-2 border rounded transition ${
                  selectedDirectors.includes(director.id)
                    ? 'bg-purple-100 border-purple-500'
                    : 'hover:bg-purple-50'
                }`}
              >
                <img
                  src={
                    director.profile_path
                      ? `https://image.tmdb.org/t/p/w200${director.profile_path}`
                      : 'https://via.placeholder.com/200x300?text=No+Image'
                  }
                  alt={director.name}
                  className="w-24 h-24 rounded-full object-cover mb-2"
                />
                <input
                  type="checkbox"
                  checked={selectedDirectors.includes(director.id)}
                  onChange={(e) => handleDirectorChange(director.id, e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-center">{director.name}</span>
              </label>
            ))}
          </div>
          {selectedDirectorObjects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Selected Directors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedDirectorObjects.map(director => (
                  <div key={director.id} className="relative flex flex-col items-center p-2 border rounded">
                    <button
                      onClick={() => {
                        setSelectedDirectors(prev => prev.filter(id => id !== director.id));
                        setSelectedDirectorObjects(prev => prev.filter(d => d.id !== director.id));
                      }}
                      className="absolute top-1 right-1 text-gray-600 hover:text-red-600 focus:outline-none"
                      aria-label={`Remove ${director.name}`}
                      style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      ✕
                    </button>
                    <img
                      src={director.profile_path
                        ? `https://image.tmdb.org/t/p/w200${director.profile_path}`
                        : 'https://via.placeholder.com/200x300?text=No+Image'}
                      alt={director.name}
                      className="w-24 h-24 rounded-full object-cover mb-2"
                    />
                    <span className="text-center text-sm">{director.name}</span>
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
            else if (activeTab === 'actors') setActiveTab('directors');
            else if (activeTab === 'directors') setActiveTab('movies');
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
            (activeTab === 'directors' && selectedDirectors.length === 0) ||
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