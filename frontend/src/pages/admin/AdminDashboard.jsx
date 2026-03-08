import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { motion } from 'framer-motion';

const getAdminEmail = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = jwt_decode(token);
    return decoded.sub || decoded.email || null;
  } catch {
    return null;
  }
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [catalogTab, setCatalogTab] = useState('movies'); // movies | playlists
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [movies, setMovies] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [movieFilter, setMovieFilter] = useState('');
  const [playlistFilter, setPlaylistFilter] = useState('');
  const [newMovie, setNewMovie] = useState({
    tmdbId: '',
    title: '',
    category: '',
    overridePosterUrl: '',
    overrideGenres: '',
    streamUrl: '',
  });
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveOptions, setArchiveOptions] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveSearched, setArchiveSearched] = useState(false);
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbSearched, setTmdbSearched] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const adminEmail = getAdminEmail();

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8085/admin/reviews', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReviews(res.data || []);
    } catch (e) {
      console.error('Failed to load reviews for moderation', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8085/admin/reviews/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReviews((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (e) {
      console.error('Failed to delete review', e);
      alert('Failed to delete review');
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8088/admin/statistics/overview', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStats(res.data || null);
    } catch (e) {
      console.error('Failed to load statistics', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadMovies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8083/admin/movies', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMovies(res.data || []);
    } catch (e) {
      console.error('Failed to load admin movies', e);
    }
  };

  const searchArchive = async (e) => {
    e.preventDefault();
    if (!archiveQuery.trim()) return;
    const token = localStorage.getItem('token');
    try {
      setLoadingArchive(true);
      setArchiveSearched(true);
      const res = await axios.get('http://localhost:8083/admin/archive/search', {
        params: { query: archiveQuery.trim(), rows: 8 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setArchiveOptions(res.data || []);
    } catch (e) {
      console.error('Failed to search Internet Archive', e);
      alert('Failed to search Internet Archive');
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleUploadPoster = async (file) => {
    if (!file) return;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('http://localhost:8087/images/upload', formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // multipart формирует boundary автоматически
        },
      });
      const url = res.data;
      setNewMovie((m) => ({ ...m, overridePosterUrl: url }));
    } catch (e) {
      console.error('Failed to upload poster', e);
      alert('Failed to upload poster');
    }
  };

  const startEditMovie = (movie) => {
    setEditingMovie({
      id: movie.id,
      title: movie.title || '',
      category: movie.category || '',
      posterUrl: movie.posterUrl || '',
      genres: movie.genres || '',
      streamUrl: movie.streamUrl || '',
      description: movie.description || '',
      active: movie.active ?? true,
    });
  };

  const cancelEditMovie = () => {
    setEditingMovie(null);
  };

  const saveEditMovie = async () => {
    if (!editingMovie) return;
    const token = localStorage.getItem('token');
    try {
      setEditingSaving(true);
      const payload = {
        title: editingMovie.title,
        category: editingMovie.category,
        posterUrl: editingMovie.posterUrl,
        genres: editingMovie.genres,
        streamUrl: editingMovie.streamUrl,
        description: editingMovie.description,
        active: editingMovie.active,
      };
      const res = await axios.put(
        `http://localhost:8083/admin/movies/${editingMovie.id}`,
        payload,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const updated = res.data;
      setMovies((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMovie(null);
    } catch (e) {
      console.error('Failed to update movie', e);
      alert('Failed to update movie');
    } finally {
      setEditingSaving(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8083/admin/playlists', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPlaylists(res.data || []);
    } catch (e) {
      console.error('Failed to load admin playlists', e);
    }
  };

  const addMovie = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = {
        tmdbId: newMovie.tmdbId ? Number(newMovie.tmdbId) : null,
        title: newMovie.title || '',
        category: newMovie.category || null,
        overridePosterUrl: newMovie.overridePosterUrl || null,
        overrideGenres: newMovie.overrideGenres || null,
        streamUrl: newMovie.streamUrl || null,
      };
      const res = await axios.post('http://localhost:8083/admin/movies', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMovies((prev) => [...prev, res.data]);
      setNewMovie({
        tmdbId: '',
        title: '',
        category: '',
        overridePosterUrl: '',
        overrideGenres: '',
        streamUrl: '',
      });
    } catch (e) {
      console.error('Failed to add movie', e);
      alert('Failed to add movie');
    }
  };

  const deleteMovie = async (id) => {
    if (!window.confirm('Delete this movie from catalog?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8083/admin/movies/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMovies((prev) => prev.filter((m) => m.id !== id));
      setPlaylists((prev) =>
        prev.map((p) => ({
          ...p,
          movies: (p.movies || []).filter((m) => m.id !== id),
        }))
      );
    } catch (e) {
      console.error('Failed to delete movie', e);
      alert('Failed to delete movie');
    }
  };

  const addPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://localhost:8083/admin/playlists',
        { name: newPlaylistName.trim(), description: '', active: true },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPlaylists((prev) => [...prev, res.data]);
      setNewPlaylistName('');
    } catch (e) {
      console.error('Failed to create playlist', e);
      alert('Failed to create playlist');
    }
  };

  const deletePlaylist = async (id) => {
    if (!window.confirm('Delete this playlist?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8083/admin/playlists/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
      }
    } catch (e) {
      console.error('Failed to delete playlist', e);
      alert('Failed to delete playlist');
    }
  };

  const addMovieToPlaylist = async (playlistId, movieId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `http://localhost:8083/admin/playlists/${playlistId}/movies/${movieId}`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? res.data : p))
      );
    } catch (e) {
      console.error('Failed to add movie to playlist', e);
      alert('Failed to add movie to playlist');
    }
  };

  const removeMovieFromPlaylist = async (playlistId, movieId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.delete(
        `http://localhost:8083/admin/playlists/${playlistId}/movies/${movieId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? res.data : p))
      );
    } catch (e) {
      console.error('Failed to remove movie from playlist', e);
      alert('Failed to remove movie from playlist');
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'statistics') {
      loadStats();
    } else if (activeTab === 'movies') {
      loadMovies();
      loadPlaylists();
    }
  }, [activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-100 p-4 sm:p-6"
    >
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Manage reviews, view statistics, and (optionally) control the catalog.
        </p>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'reviews'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Reviews moderation
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'statistics'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'movies'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Movies (catalog)
          </button>
        </div>

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              All reviews
            </h2>
            {loadingReviews ? (
              <p className="text-gray-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500">No reviews found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Movie</th>
                      <th className="px-3 py-2 text-left">Rating</th>
                      <th className="px-3 py-2 text-left">Created</th>
                      <th className="px-3 py-2 text-left">Text</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{r.id}</td>
                        <td className="px-3 py-2">{r.userEmail}</td>
                        <td className="px-3 py-2">{r.movieTitle}</td>
                        <td className="px-3 py-2">{r.rating}</td>
                        <td className="px-3 py-2">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : ''}
                        </td>
                        <td className="px-3 py-2 max-w-xs">
                          <span className="line-clamp-3 text-gray-700">
                            {r.text}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Platform statistics
            </h2>
            {loadingStats ? (
              <p className="text-gray-500">Loading statistics...</p>
            ) : !stats ? (
              <p className="text-gray-500">
                No statistics data available yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <p className="text-xs uppercase text-purple-600 font-semibold">
                    Total watched
                  </p>
                  <p className="text-2xl font-bold text-purple-800">
                    {stats.totalWatchedMovies ?? '—'}
                  </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <p className="text-xs uppercase text-indigo-600 font-semibold">
                    Unique movies
                  </p>
                  <p className="text-2xl font-bold text-indigo-800">
                    {stats.uniqueMovies ?? '—'}
                  </p>
                </div>
                <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
                  <p className="text-xs uppercase text-pink-600 font-semibold">
                    Avg. rating
                  </p>
                  <p className="text-2xl font-bold text-pink-800">
                    —
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Catalog management
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCatalogTab('movies')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    catalogTab === 'movies'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('playlists')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    catalogTab === 'playlists'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Playlists
                </button>
              </div>
            </div>

            {catalogTab === 'movies' && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Add movie
                  </h3>
                <form onSubmit={addMovie} className="space-y-2 mb-4">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Movie title (for TMDB search)"
                    value={newMovie.title}
                    onChange={(e) =>
                      setNewMovie((m) => ({ ...m, title: e.target.value }))
                    }
                    required
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newMovie.title.trim()) return;
                        const token = localStorage.getItem('token');
                        try {
                          setTmdbLoading(true);
                          setTmdbSearched(true);
                          const res = await axios.get(
                            'http://localhost:8083/admin/movies/tmdb-search',
                            {
                              params: { query: newMovie.title.trim() },
                              headers: token
                                ? { Authorization: `Bearer ${token}` }
                                : {},
                            }
                          );
                          setTmdbResults(res.data || []);
                        } catch (e) {
                          console.error('Failed to search TMDB for admin', e);
                          alert('Failed to search TMDB movies');
                        } finally {
                          setTmdbLoading(false);
                        }
                      }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      {tmdbLoading ? 'Searching TMDB...' : 'Search TMDB'}
                    </button>
                    {newMovie.tmdbId && (
                      <span className="text-green-700">
                        Selected TMDB id: {newMovie.tmdbId}
                      </span>
                    )}
                  </div>
                  {tmdbSearched && !tmdbLoading && tmdbResults.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No TMDB movies found for this title.
                    </p>
                  )}
                  {tmdbResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto text-xs space-y-1 border border-purple-100 rounded p-2 bg-purple-50/40">
                      {tmdbResults.map((m) => (
                        <div
                          key={m.tmdbId}
                          className="flex justify-between items-start gap-2"
                        >
                          <div className="flex-1">
                            <div className="font-semibold">
                              {m.title}{' '}
                              {m.releaseDate && (
                                <span className="text-gray-500">
                                  ({m.releaseDate})
                                </span>
                              )}
                            </div>
                            {m.overview && (
                              <div className="text-gray-600 line-clamp-2">
                                {m.overview}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewMovie((prev) => ({
                                ...prev,
                                tmdbId: m.tmdbId,
                                title: m.title || prev.title,
                              }))
                            }
                            className="ml-2 px-2 py-0.5 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Category (e.g. 'Featured', 'Admin list')"
                    value={newMovie.category}
                    onChange={(e) =>
                      setNewMovie((m) => ({ ...m, category: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Custom poster URL (optional)"
                    value={newMovie.overridePosterUrl}
                    onChange={(e) =>
                      setNewMovie((m) => ({
                        ...m,
                        overridePosterUrl: e.target.value,
                      }))
                    }
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Or upload poster:</span>
                    <label className="cursor-pointer px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadPoster(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Custom genres, comma-separated (optional)"
                    value={newMovie.overrideGenres}
                    onChange={(e) =>
                      setNewMovie((m) => ({
                        ...m,
                        overrideGenres: e.target.value,
                      }))
                    }
                  />
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">
                      Streaming URL (e.g. Internet Archive embed URL)
                    </label>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-full"
                      placeholder="https://archive.org/embed/..."
                      value={newMovie.streamUrl}
                      onChange={(e) =>
                        setNewMovie((m) => ({
                          ...m,
                          streamUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Add movie
                  </button>
                </form>

                <div className="mb-4 border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-semibold mb-2 text-gray-800">
                    Internet Archive search (optional)
                  </h4>
                  <form
                    onSubmit={searchArchive}
                    className="flex flex-col sm:flex-row gap-2 mb-2"
                  >
                    <input
                      type="text"
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Search public-domain movies..."
                      value={archiveQuery}
                      onChange={(e) => setArchiveQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gray-800 text-white rounded text-xs"
                    >
                      {loadingArchive ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  {archiveSearched && !loadingArchive && archiveOptions.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No public-domain movies found for this query.
                    </p>
                  )}
                  {archiveOptions.length > 0 && (
                    <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                      {archiveOptions.map((opt) => (
                        <div
                          key={opt.identifier}
                          className="flex justify-between items-center border rounded px-2 py-1 bg-gray-50"
                        >
                          <span className="mr-2 line-clamp-2">
                            {opt.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewMovie((m) => ({
                                ...m,
                                streamUrl: opt.streamUrl,
                              }))
                            }
                            className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Movies in catalog
                      <span className="ml-2 text-xs text-gray-500">
                        ({movies.length})
                      </span>
                    </h3>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 text-sm w-full sm:w-72"
                      placeholder="Search in catalog..."
                      value={movieFilter}
                      onChange={(e) => setMovieFilter(e.target.value)}
                    />
                  </div>

                  {movies.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No admin movies yet. Add one using the title (TMDB will be
                      used by default).
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto scrollbar-thin pr-1">
                      {movies
                        .filter((m) => {
                          const q = movieFilter.trim().toLowerCase();
                          if (!q) return true;
                          const title = (m.title || '').toLowerCase();
                          const cat = (m.category || '').toLowerCase();
                          const tmdb = m.tmdbId != null ? String(m.tmdbId) : '';
                          return (
                            title.includes(q) ||
                            cat.includes(q) ||
                            tmdb.includes(q) ||
                            String(m.id).includes(q)
                          );
                        })
                        .map((m) => (
                      <div
                        key={m.id}
                        className="border rounded px-3 py-2 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="mr-2">
                            <p className="font-semibold text-sm">
                              {m.title || '(Title from TMDB)'}{' '}
                              {m.tmdbId && (
                                <span className="text-xs text-gray-500">
                                  #{m.tmdbId}
                                </span>
                              )}
                            </p>
                            {m.category && (
                              <p className="text-xs text-gray-500">
                                Category: {m.category}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/watch-admin/${m.id}`}
                              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              Watch
                            </a>
                            <button
                              onClick={() => startEditMovie(m)}
                              className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMovie(m.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {editingMovie && editingMovie.id === m.id && (
                          <div className="mt-3 space-y-2 border-t border-gray-200 pt-2 text-xs">
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Title"
                              value={editingMovie.title}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Category"
                              value={editingMovie.category}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  category: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Poster URL"
                              value={editingMovie.posterUrl}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  posterUrl: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Genres (comma-separated)"
                              value={editingMovie.genres}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  genres: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Streaming URL"
                              value={editingMovie.streamUrl}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  streamUrl: e.target.value,
                                }))
                              }
                            />
                            <textarea
                              className="border rounded px-2 py-1 w-full"
                              rows={2}
                              placeholder="Description"
                              value={editingMovie.description}
                              onChange={(e) =>
                                setEditingMovie((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEditMovie}
                                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveEditMovie}
                                disabled={editingSaving}
                                className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                              >
                                {editingSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {catalogTab === 'playlists' && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Create playlist
                  </h3>
                  <form onSubmit={addPlaylist} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      className="border rounded px-3 py-2 flex-1 text-sm"
                      placeholder="New playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      Create
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Playlists
                      <span className="ml-2 text-xs text-gray-500">
                        ({playlists.length})
                      </span>
                    </h3>
                    <input
                      type="text"
                      className="border rounded px-3 py-2 text-sm w-full sm:w-72"
                      placeholder="Search playlists..."
                      value={playlistFilter}
                      onChange={(e) => setPlaylistFilter(e.target.value)}
                    />
                  </div>

                  {playlists.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No playlists. Create one and add movies to it.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[32rem] overflow-y-auto scrollbar-thin pr-1">
                      {playlists
                        .filter((p) => {
                          const q = playlistFilter.trim().toLowerCase();
                          if (!q) return true;
                          const name = (p.name || '').toLowerCase();
                          return (
                            name.includes(q) ||
                            String(p.id).includes(q) ||
                            String((p.movies || []).length).includes(q)
                          );
                        })
                        .map((p) => {
                          const isSelected = selectedPlaylistId === p.id;
                          return (
                            <div
                              key={p.id}
                              className={`border rounded px-3 py-2 bg-gray-50 ${
                                isSelected ? 'border-purple-500' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPlaylistId(isSelected ? null : p.id)
                                  }
                                  className="font-semibold text-sm text-left"
                                >
                                  {p.name}{' '}
                                  <span className="text-xs text-gray-500">
                                    ({(p.movies || []).length} movies)
                                  </span>
                                </button>
                                <button
                                  onClick={() => deletePlaylist(p.id)}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                              {isSelected && (
                                <div className="mt-2 space-y-2">
                                  <div className="text-xs text-gray-600">
                                    Movies in playlist:
                                  </div>
                                  {(p.movies || []).length === 0 ? (
                                    <p className="text-xs text-gray-500">
                                      No movies yet.
                                    </p>
                                  ) : (
                                    <ul className="text-xs space-y-1">
                                      {p.movies.map((m) => (
                                        <li
                                          key={m.id}
                                          className="flex justify-between items-center"
                                        >
                                          <span>
                                            {m.title || '(TMDB title)'} #{m.tmdbId}
                                          </span>
                                          <button
                                            onClick={() =>
                                              removeMovieFromPlaylist(p.id, m.id)
                                            }
                                            className="ml-2 px-2 py-0.5 bg-gray-300 rounded hover:bg-gray-400"
                                          >
                                            Remove
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <div className="mt-2">
                                    <label className="block text-xs text-gray-600 mb-1">
                                      Add movie to this playlist:
                                    </label>
                                    <select
                                      className="border rounded px-2 py-1 text-xs w-full"
                                      defaultValue=""
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        addMovieToPlaylist(p.id, Number(val));
                                        e.target.value = '';
                                      }}
                                    >
                                      <option value="">Select movie</option>
                                      {movies.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.title || '(TMDB title)'} #{m.tmdbId}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;