import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { FaFilm, FaGlobe, FaVideo, FaSearch, FaTrash, FaStar, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

const Statistics = ({ email }) => {
    const [stats, setStats] = useState(null);
    const [movies, setMovies] = useState([]);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingWatched, setLoadingWatched] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [selectedTab, setSelectedTab] = useState('statistics');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);

    // Fetch statistics
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoadingStats(true);
                const response = await axios.get(`http://localhost:8088/statistics?email=${encodeURIComponent(email)}`);
                setStats(response.data);
                setLoadingStats(false);
            } catch (error) {
                console.error('Error fetching statistics:', error);
                toast.error('Failed to load statistics');
                setLoadingStats(false);
            }
        };

        if (email) {
            fetchStatistics();
        }
    }, [email]);

    // Fetch watched movies and normalize data
    useEffect(() => {
        const fetchWatchedMovies = async () => {
            try {
                setLoadingWatched(true);
                const response = await axios.get(
                    `http://localhost:8088/statistics/watched?email=${encodeURIComponent(email)}`
                );
                console.log('Watched movies response:', response.data);
                const normalizedMovies = response.data.map(movie => {
                    const normalized = {
                        id: movie.movieId,
                        movieId: movie.movieId,
                        title: movie.movieTitle || movie.title || 'Unknown Title',
                        posterPath: movie.posterUrl ? movie.posterUrl.replace('https://image.tmdb.org/t/p/w500', '') : null,
                        voteAverage: movie.rating || null,
                        genreNames: movie.genres ? movie.genres.split(', ') : [],
                        overview: movie.overview || 'No description available',
                        watched: true
                    };
                    console.log('Normalized watched movie:', normalized);
                    return normalized;
                });
                setWatchedMovies(normalizedMovies);
                setLoadingWatched(false);
            } catch (error) {
                console.error('Error fetching watched movies:', error);
                toast.error('Failed to load watched movies');
                setLoadingWatched(false);
            }
        };

        if (email) {
            fetchWatchedMovies();
        }
    }, [email]);

    // Fetch movies (popular or search) and sync watched status
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoadingMovies(true);
                const response = await axios.get(
                    `http://localhost:8088/statistics/movies?email=${encodeURIComponent(email)}&query=${encodeURIComponent(searchQuery)}&page=${page}`
                );
                console.log('Search movies response:', response.data);
                const newMovies = response.data.map(movie => {
                    const normalized = {
                        ...movie,
                        posterPath: movie.posterPath || movie.poster_path || null,
                        voteAverage: movie.voteAverage || movie.vote_average || null,
                        watched: watchedMovies.some(wm => wm.movieId === movie.id)
                    };
                    console.log('Normalized search movie:', normalized);
                    return normalized;
                });
                setMovies(prev => page === 1 ? newMovies : [...prev, ...newMovies]);
                setHasMore(response.data.length > 0);
                setLoadingMovies(false);
            } catch (error) {
                console.error('Error fetching movies:', error);
                toast.error('Failed to load movies');
                setLoadingMovies(false);
            }
        };

        if (email && selectedTab === 'search') {
            fetchMovies();
        }
    }, [email, searchQuery, page, selectedTab, watchedMovies]);

    // Reset movies and page when switching to search tab or changing query
    useEffect(() => {
        if (selectedTab === 'search') {
            setMovies([]);
            setPage(1);
            setHasMore(true);
        }
    }, [selectedTab, searchQuery]);

    // Infinite scroll observer
    useEffect(() => {
        if (!hasMore || loadingMovies) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [hasMore, loadingMovies]);

    // Fetch movie details
    useEffect(() => {
        if (selectedMovie) {
            const fetchMovieDetails = async () => {
                try {
                    setLoadingDetails(true);
                    setDetailsError(null);
                    const response = await axios.get(
                        `http://localhost:8088/statistics/movies/${selectedMovie.id || selectedMovie.movieId}?email=${encodeURIComponent(email)}`
                    );
                    const details = {
                        ...response.data,
                        posterPath: response.data.posterPath || response.data.poster_path || null,
                        voteAverage: response.data.voteAverage || response.data.vote_average || null,
                        watched: watchedMovies.some(wm => wm.movieId === response.data.id)
                    };
                    console.log('Movie details:', details);
                    setMovieDetails(details);
                    setLoadingDetails(false);
                } catch (error) {
                    console.error('Error fetching movie details:', error);
                    setDetailsError(error.message || 'Failed to load movie details');
                    setMovieDetails(null);
                    setLoadingDetails(false);
                    toast.error('Failed to load movie details');
                }
            };
            fetchMovieDetails();
        }
    }, [selectedMovie, email, watchedMovies]);

    const handleMarkAsWatched = async (movieId) => {
        try {
            await axios.post(
                `http://localhost:8088/statistics/watched?email=${encodeURIComponent(email)}`,
                { movieId }
            );
            const movieToAdd = movies.find(movie => movie.id === movieId);
            if (movieToAdd) {
                const normalizedMovie = {
                    id: movieToAdd.id,
                    movieId: movieToAdd.id,
                    title: movieToAdd.title || 'Unknown Title',
                    posterPath: movieToAdd.posterPath || null,
                    voteAverage: movieToAdd.voteAverage || null,
                    genreNames: movieToAdd.genreNames || [],
                    overview: movieToAdd.overview || 'No description available',
                    watched: true
                };
                console.log('Adding watched movie:', normalizedMovie);
                setWatchedMovies(prev => [...prev, normalizedMovie]);
                setMovies(prev =>
                    prev.map(movie =>
                        movie.id === movieId ? { ...movie, watched: true } : movie
                    )
                );
                if (movieDetails && movieDetails.id === movieId) {
                    setMovieDetails(prev => ({ ...prev, watched: true }));
                }
            }
            const response = await axios.get(`http://localhost:8088/statistics?email=${encodeURIComponent(email)}`);
            setStats(response.data);
            toast.success('Marked as watched!');
        } catch (error) {
            console.error('Error marking as watched:', error);
            toast.error('Failed to mark as watched');
        }
    };

    const handleRemoveFromWatched = async (movieId) => {
        try {
            await axios.delete(
                `http://localhost:8088/statistics/watched/${movieId}?email=${encodeURIComponent(email)}`
            );
            setWatchedMovies(prev => prev.filter(movie => movie.movieId !== movieId));
            setMovies(prev =>
                prev.map(movie =>
                    movie.id === movieId ? { ...movie, watched: false } : movie
                )
            );
            if (movieDetails && movieDetails.id === movieId) {
                setMovieDetails(prev => ({ ...prev, watched: false }));
            }
            const response = await axios.get(`http://localhost:8088/statistics?email=${encodeURIComponent(email)}`);
            setStats(response.data);
            toast.success('Removed from watched!');
        } catch (error) {
            console.error('Error removing from watched:', error);
            toast.error('Failed to remove from watched');
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const closeModal = () => {
        setSelectedMovie(null);
        setMovieDetails(null);
        setDetailsError(null);
    };

    if (loadingStats && selectedTab === 'statistics') {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (loadingWatched && selectedTab === 'watched') {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Movie Statistics</h2>

            {/* Tab Navigation */}
            <div className="mb-4 flex space-x-4">
                <button
                    onClick={() => setSelectedTab('statistics')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                        selectedTab === 'statistics'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } focus:ring-2 focus:ring-purple-500 transition`}
                >
                    Statistics Overview
                </button>
                <button
                    onClick={() => setSelectedTab('watched')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                        selectedTab === 'watched'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } focus:ring-2 focus:ring-purple-500 transition`}
                >
                    Your Watched Movies
                </button>
                <button
                    onClick={() => setSelectedTab('search')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                        selectedTab === 'search'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } focus:ring-2 focus:ring-purple-500 transition`}
                >
                    Find Movies to Watch
                </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'statistics' && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800">Statistics Overview</h3>
                    {stats && stats.totalWatched > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                                    <FaFilm className="mr-2 text-purple-500" /> Total Movies Watched
                                </h4>
                                <div className="text-4xl font-bold text-purple-600">{stats.totalWatched}</div>
                                <p className="text-gray-600 mt-2">Movies you've marked as watched</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700">Genre Distribution</h4>
                                {stats.genreDistribution && stats.genreDistribution.length > 0 ? (
                                    <div className="h-64">
                                        <BarChart
                                            width={500}
                                            height={300}
                                            data={stats.genreDistribution}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="genre"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#8884d8" name="Movies" />
                                        </BarChart>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No genres to display yet.</p>
                                        <p className="text-sm mt-2">Watch some movies to see your genre preferences!</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700">Top Actors</h4>
                                {stats.actorDistribution && stats.actorDistribution.length > 0 ? (
                                    <div className="h-64">
                                        <PieChart width={500} height={300}>
                                            <Pie
                                                data={stats.actorDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {stats.actorDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No actors to display yet.</p>
                                        <p className="text-sm mt-2">Watch movies to see which actors you enjoy!</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700">Top Directors</h4>
                                {stats.directorDistribution && stats.directorDistribution.length > 0 ? (
                                    <div className="h-64">
                                        <BarChart
                                            width={500}
                                            height={300}
                                            data={stats.directorDistribution}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 45 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#00C49F" name="Movies" />
                                        </BarChart>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No directors to display yet.</p>
                                        <p className="text-sm mt-2">Watch movies to discover your favorite directors!</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                                    <FaGlobe className="mr-2 text-purple-500" /> Country Distribution
                                </h4>
                                {stats.countryDistribution && stats.countryDistribution.length > 0 ? (
                                    <div className="h-64">
                                        <PieChart width={500} height={300}>
                                            <Pie
                                                data={stats.countryDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                                nameKey="country"
                                                label={({ country, percent }) => `${country}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {stats.countryDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No countries to display yet.</p>
                                        <p className="text-sm mt-2">Watch movies from different countries to see the distribution!</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700">Your Preferences</h4>
                                {stats.preferencesAnalysis ? (
                                    <p className="text-gray-600">{stats.preferencesAnalysis}</p>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No preferences analyzed yet.</p>
                                        <p className="text-sm mt-2">Watch more movies to uncover your tastes!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold text-gray-700">No statistics available</p>
                            <p className="text-gray-500 mt-2">Mark some movies as watched in the "Find Movies to Watch" tab to see your stats!</p>
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'watched' && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Watched Movies</h3>
                    {watchedMovies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {watchedMovies.map(movie => (
                                <MovieCard
                                    key={movie.movieId}
                                    movie={movie}
                                    onMarkAsWatched={handleMarkAsWatched}
                                    onRemoveFromWatched={handleRemoveFromWatched}
                                    onClick={() => setSelectedMovie(movie)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold text-gray-700">No watched movies yet</p>
                            <p className="text-gray-500 mt-2">Find movies in the "Find Movies to Watch" tab and mark them as watched!</p>
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'search' && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Find Movies to Watch</h3>
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search for movies..."
                                className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {loadingMovies && page === 1 ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : movies.length > 0 ? (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {movies.map(movie => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        onMarkAsWatched={handleMarkAsWatched}
                                        onRemoveFromWatched={handleRemoveFromWatched}
                                        onClick={() => setSelectedMovie(movie)}
                                    />
                                ))}
                            </div>
                            {loadingMovies && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                                </div>
                            )}
                            <div ref={loaderRef} className="h-10"></div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                            <div className="text-gray-500 mb-4">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold text-gray-700">No movies found</p>
                            <p className="text-gray-500 mt-2">Try searching for a movie title or browse popular movies below!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Movie Details Modal */}
            {selectedMovie && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {loadingDetails ? (
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
                                                ? `https://image.tmdb.org/t/p/w500${movieDetails.posterPath}`
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
                                            {movieDetails.voteAverage ? movieDetails.voteAverage.toFixed(1) : 'N/A'} / 10
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
                                        <p className="text-gray-600 mb-2">
                                            <span className="font-semibold">Country:</span>{' '}
                                            {movieDetails.country || 'N/A'}
                                        </p>
                                        <p className="text-gray-700 mb-4">
                                            <span className="font-semibold">Overview:</span>{' '}
                                            {movieDetails.overview || 'No description available'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4 space-x-2">
                                    {movieDetails.watched ? (
                                        <button
                                            onClick={() => handleRemoveFromWatched(movieDetails.id)}
                                            className="flex items-center px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                        >
                                            <FaTrash className="mr-1" />
                                            Remove from Watched
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkAsWatched(movieDetails.id)}
                                            className="flex items-center px-4 py-2 rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
                                        >
                                            <FaEye className="mr-1" />
                                            Mark as Watched
                                        </button>
                                    )}
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

const MovieCard = ({ movie, onMarkAsWatched, onRemoveFromWatched, onClick }) => {
    const displayMovie = {
        id: movie.id || movie.movieId,
        title: movie.title || movie.movieTitle || 'Unknown Title',
        posterPath: movie.posterPath || (movie.posterUrl?.replace('https://image.tmdb.org/t/p/w500', '') || null),
        voteAverage: movie.voteAverage || movie.rating || null,
        genreNames: movie.genreNames || (movie.genres ? movie.genres.split(', ') : []),
        overview: movie.overview || 'No description available',
        watched: movie.watched || false
    };

    console.log('MovieCard displayMovie:', displayMovie);

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
            onClick={onClick}
        >
            <img
                src={
                    displayMovie.posterPath
                        ? `https://image.tmdb.org/t/p/w500${displayMovie.posterPath}`
                        : 'https://via.placeholder.com/500x750?text=No+Image'
                }
                alt={displayMovie.title}
                className="w-full h-96 object-cover"
            />
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{displayMovie.title}</h3>
                    <span className="flex items-center text-yellow-500">
                        <FaStar className="mr-1" />
                        {displayMovie.voteAverage ? displayMovie.voteAverage.toFixed(1) : 'N/A'}
                    </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                    {displayMovie.genreNames.length > 0 ? displayMovie.genreNames.join(', ') : 'No genres'}
                </p>
                <p className="text-gray-700 mb-4 line-clamp-3">
                    {displayMovie.overview}
                </p>
                <div className="flex space-x-2">
                    {displayMovie.watched ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromWatched(displayMovie.id);
                            }}
                            className="flex items-center px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                            <FaTrash className="mr-1" />
                            Remove from Watched
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsWatched(displayMovie.id);
                            }}
                            className="flex items-center px-3 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                            <FaEye className="mr-1" />
                            Mark as Watched
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Statistics;