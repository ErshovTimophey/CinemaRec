import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { FaEye, FaHeart, FaPlay, FaRegHeart } from 'react-icons/fa';

const API = 'http://localhost:8083';
const LOG = '[Movies posters]';

// Берём posterUrl так же, как на странице фильма: GET /movies/:id -> posterUrl
function usePosterUrls(movies) {
  const [posterUrls, setPosterUrls] = useState({});
  const idsKey = useMemo(
    () =>
      movies
        .map((m) => m?.id)
        .filter(Boolean)
        .sort((a, b) => a - b)
        .join(','),
    [movies]
  );

  useEffect(() => {
    if (!movies.length) return;

    const ids = movies.map((m) => m?.id).filter(Boolean);
    console.log(LOG, 'Старт подгрузки постеров: ids=', ids);

    let cancelled = false;
    movies.forEach((m) => {
      if (!m?.id) return;
      const id = m.id;

      console.log(LOG, `GET ${API}/movies/${id} -> запрос`);
      axios
        .get(`${API}/movies/${id}`)
        .then((res) => {
          const url = res.data?.posterUrl ?? res.data?.poster_url ?? null;
          console.log(
            LOG,
            `GET /movies/${id} -> ответ: posterUrl=${res.data?.posterUrl ?? '—'} poster_url=${res.data?.poster_url ?? '—'} итог=${url ?? '—'}`
          );
          if (cancelled) return;
          if (!url || !String(url).trim()) return;
          setPosterUrls((prev) =>
            prev[id] === url ? prev : { ...prev, [id]: url }
          );
        })
        .catch((err) => {
          console.warn(
            LOG,
            `GET /movies/${id} -> ошибка:`,
            err?.response?.status,
            err?.message || err
          );
        });
    });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return posterUrls;
}

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('catalog'); // catalog | favorites
  const [favoriteMovieIds, setFavoriteMovieIds] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [watchedMovieIds, setWatchedMovieIds] = useState([]);
  const navigate = useNavigate();

  const posterUrls = usePosterUrls(movies);

  const token = localStorage.getItem('token');
  let email = null;
  if (token) {
    try {
      const decoded = jwt_decode(token);
      email = decoded.sub || decoded.email || null;
    } catch (e) {
      console.error(LOG, 'Failed to decode token in Movies page', e);
    }
  }

  const favoriteIdSet = useMemo(
    () => new Set((favoriteMovieIds || []).map((id) => Number(id)).filter(Boolean)),
    [favoriteMovieIds]
  );
  const watchedIdSet = useMemo(
    () => new Set((watchedMovieIds || []).map((id) => Number(id)).filter(Boolean)),
    [watchedMovieIds]
  );

  const loadFavoritesAndWatched = async () => {
    if (!email) return;
    try {
      const prefsRes = await axios.get(`http://localhost:8082/users/${email}/preferences`);
      const pref = prefsRes.data?.preferences ?? prefsRes.data ?? {};
      setFavoriteMovieIds(pref.favoriteMovies || []);
      setFavoriteMovies(prefsRes.data?.favoriteMovies || []);
    } catch (e) {
      setFavoriteMovieIds([]);
      setFavoriteMovies([]);
    }
    try {
      const watchedRes = await axios.get(
        `http://localhost:8088/statistics/watched?email=${encodeURIComponent(email)}`
      );
      const ids = (watchedRes.data || [])
        .map((m) => m?.movieId)
        .map((id) => Number(id))
        .filter(Boolean);
      setWatchedMovieIds(ids);
    } catch (e) {
      setWatchedMovieIds([]);
    }
  };

  const toggleFavoriteMovie = async (movieId) => {
    if (!email) return;
    try {
      const prefsRes = await axios.get(`http://localhost:8082/users/${email}/preferences`);
      const pref = prefsRes.data?.preferences ?? prefsRes.data ?? {};
      const current = (pref.favoriteMovies || []).map((id) => Number(id)).filter(Boolean);
      const idNum = Number(movieId);
      const next = current.includes(idNum)
        ? current.filter((id) => id !== idNum)
        : [...current, idNum];

      const payload = {
        favoriteGenres: pref.favoriteGenres || [],
        favoriteActors: pref.favoriteActors || [],
        favoriteDirectors: pref.favoriteDirectors || [],
        favoriteMovies: next,
        minRating: pref.minRating ?? 7,
      };

      await axios.put(`http://localhost:8082/users/${email}/preferences`, payload);
      setFavoriteMovieIds(next);

      // Обновим объектный список избранного для вкладки Favorites
      const refreshed = await axios.get(`http://localhost:8082/users/${email}/preferences`);
      setFavoriteMovies(refreshed.data?.favoriteMovies || []);
    } catch (e) {
      console.error(LOG, 'Failed to toggle favorite', e);
    }
  };

  const markAsWatched = async (tmdbId) => {
    if (!email || !tmdbId) return;
    try {
      await axios.post(
        `http://localhost:8088/statistics/watched?email=${encodeURIComponent(email)}`,
        { movieId: Number(tmdbId) }
      );
      setWatchedMovieIds((prev) =>
        prev.includes(Number(tmdbId)) ? prev : [...prev, Number(tmdbId)]
      );
    } catch (e) {
      console.error(LOG, 'Failed to mark as watched', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(LOG, `GET ${API}/movies -> запрос`);
        const res = await axios.get(`${API}/movies`);
        const list = res.data || [];
        console.log(LOG, `GET /movies -> ответ: items=${list.length}`);
        list.forEach((m, i) => {
          console.log(
            LOG,
            `  [${i}] id=${m?.id} title=${m?.title} posterUrl=${m?.posterUrl ?? '—'} poster_url=${m?.poster_url ?? '—'}`
          );
        });
        setMovies(list);
      } catch (e) {
        console.error(LOG, 'Failed to load movies catalog', e);
        setError('Failed to load movies catalog');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    loadFavoritesAndWatched();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-100"
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4">
          Movies catalog
        </h1>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedTab('catalog')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              selectedTab === 'catalog'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('favorites')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              selectedTab === 'favorites'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            Favorites
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading movies...</p>}
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        {selectedTab === 'catalog' && !loading && !error && movies.length === 0 && (
          <p className="text-gray-500">No movies in the catalog yet.</p>
        )}

        {selectedTab === 'catalog' && !loading && !error && movies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((m) => {
              const posterSrc =
                posterUrls[m?.id] || m?.posterUrl || m?.poster_url || null;
              const showImg = !!posterSrc;

              console.log(
                LOG,
                `Рендер карточки id=${m?.id} title=${m?.title} posterSrc=${posterSrc ?? '—'} showImg=${showImg}`
              );

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                  <div
                    className="relative overflow-hidden bg-gray-200"
                    style={{ aspectRatio: '2 / 3' }}
                  >
                    {showImg ? (
                      <img
                        src={posterSrc}
                        alt={m.title || 'Poster'}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onLoad={() => {
                          console.log(LOG, `IMG onLoad id=${m.id} src=${posterSrc}`);
                        }}
                        onError={(e) => {
                          console.warn(
                            LOG,
                            `IMG onError id=${m.id} src=${e?.target?.src || posterSrc}`
                          );
                          e.target.style.display = 'none';
                          e.target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-200 z-0"
                      style={{ display: showImg ? 'none' : 'flex' }}
                    >
                      No poster
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {m.title || '(Title from TMDB)'}
                    </h2>
                    {m.category && (
                      <p className="text-xs text-purple-600 font-medium mb-2">
                        {m.category}
                      </p>
                    )}
                    {m.genres && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {m.genres
                          .split(',')
                          .map((g) => g.trim())
                          .filter(Boolean)
                          .map((g, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[11px]"
                            >
                              {g}
                            </span>
                          ))}
                      </div>
                    )}
                    {m.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {m.description}
                      </p>
                    )}
                    <div className="mt-auto flex justify-between items-center pt-2 relative">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/watch-admin/${m.id}`}
                          className="inline-block px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                        >
                          Watch
                        </Link>

                      </div>

                      {/* Favorites + Watched — в правом нижнем углу карточки */}
                      {m.tmdbId ? (
                        <div className="absolute right-0 bottom-0 flex flex-col gap-2 items-end">
                          {watchedIdSet.has(Number(m.tmdbId)) ? (
                            <button
                              type="button"
                              onClick={() => {
                                // toggle off
                                axios
                                  .delete(
                                    `http://localhost:8088/statistics/watched/${Number(m.tmdbId)}?email=${encodeURIComponent(email)}`
                                  )
                                  .then(() =>
                                    setWatchedMovieIds((prev) =>
                                      prev.filter((id) => Number(id) !== Number(m.tmdbId))
                                    )
                                  )
                                  .catch((e) => console.error(LOG, 'Failed to unmark watched', e));
                              }}
                              className="px-2 py-1 rounded-md bg-white shadow text-[12px] font-semibold text-purple-900 hover:bg-gray-50"
                              aria-label="Unmark watched"
                            >
                              watched
                            </button>
                          ) : (
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => markAsWatched(m.tmdbId)}
                                className="p-2 rounded-lg transition bg-white border border-gray-200 hover:bg-gray-50 text-purple-700"
                                aria-label="Mark as watched"
                              >
                                <FaEye />
                              </button>
                              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition absolute -top-9 right-0 bg-black text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                                Mark as watched
                              </span>
                            </div>
                          )}

                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteMovie(m.tmdbId)}
                              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-pink-600"
                              aria-label={
                                favoriteIdSet.has(Number(m.tmdbId))
                                  ? 'Remove from favorites'
                                  : 'Add to favorites'
                              }
                            >
                              {favoriteIdSet.has(Number(m.tmdbId)) ? <FaHeart /> : <FaRegHeart />}
                            </button>
                            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition absolute -top-9 right-0 bg-black text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                              {favoriteIdSet.has(Number(m.tmdbId)) ? 'Remove from favorites' : 'Add to favorites'}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'favorites' && (
          <div>
            {favoriteMovies.length === 0 ? (
              <p className="text-gray-500">No favorite movies yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteMovies.map((fm) => {
                  const id = fm?.id;
                  const title = fm?.title || fm?.name || 'Untitled';
                  const hasPosterPath = !!(fm?.poster_path || fm?.posterPath);
                  const posterSrc = hasPosterPath
                    ? `http://localhost:8082/tmdb/movies/${id}/poster`
                    : 'https://via.placeholder.com/500x750?text=No+Image';

                  const isWatched = watchedIdSet.has(Number(id));
                  return (
                    <div
                      key={id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col relative"
                    >
                      {isWatched && (
                        <button
                          type="button"
                          onClick={() => {
                            axios
                              .delete(
                                `http://localhost:8088/statistics/watched/${Number(id)}?email=${encodeURIComponent(email)}`
                              )
                              .then(() =>
                                setWatchedMovieIds((prev) =>
                                  prev.filter((wid) => Number(wid) !== Number(id))
                                )
                              )
                              .catch((e) => console.error(LOG, 'Failed to unmark watched', e));
                          }}
                          className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-purple-300 text-purple-900 px-2 py-1 text-[11px] font-semibold shadow"
                          aria-label="Unmark watched"
                        >
                          <FaEye className="text-[11px]" />
                          Watched
                        </button>
                      )}

                      <div className="relative overflow-hidden bg-gray-200" style={{ aspectRatio: '2 / 3' }}>
                        <img
                          src={posterSrc}
                          alt={title}
                          className="w-full h-full object-cover block"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/500x750?text=No+Image';
                          }}
                        />
                      </div>

                      <div className="p-4 flex flex-col flex-1 relative min-h-[6rem]">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {title}
                        </h2>

                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/watch/${id}?email=${encodeURIComponent(email || '')}`)}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 shadow"
                          >
                            <FaPlay className="mr-2" />
                            Watch
                          </button>

                          {!isWatched && (
                            <div className="relative group/btn">
                              <button
                                type="button"
                                onClick={() => markAsWatched(id)}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-purple-800 shadow"
                                aria-label="Mark as watched"
                              >
                                <FaEye />
                              </button>
                              <span className="pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity delay-700 absolute -top-9 right-0 bg-black text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                                Mark as watched
                              </span>
                            </div>
                          )}

                          <div className="relative group/btn">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteMovie(id)}
                              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-pink-600 shadow"
                              aria-label="Remove from favorites"
                            >
                              <FaHeart />
                            </button>
                            <span className="pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity delay-700 absolute -top-9 right-0 bg-black text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                              Remove from favorites
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Movies;
