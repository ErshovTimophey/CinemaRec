import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaClock, FaFilm } from 'react-icons/fa';

const AdminMoviePlayer = () => {
  const { adminMovieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `http://localhost:8083/movies/${adminMovieId}`
        );
        setMovie(res.data);
      } catch (e) {
        console.error('Failed to load admin movie', e);
        setError('Failed to load movie');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [adminMovieId]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Movie not found'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const genres =
    movie.genres && typeof movie.genres === 'string'
      ? movie.genres.split(',').map((g) => g.trim()).filter(Boolean)
      : [];

  // Нормализуем ссылку Internet Archive: если админ передал страницу /details/,
  // преобразуем её в /embed/, чтобы в iframe был именно плеер.
  let streamUrl = movie.streamUrl;
  if (streamUrl && streamUrl.includes('archive.org/details/')) {
    streamUrl = streamUrl.replace('archive.org/details/', 'archive.org/embed/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="bg-purple-900/40 backdrop-blur-sm p-4">
        <button
          onClick={handleBack}
          className="flex items-center text-white hover:text-purple-200 transition mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex flex-col md:flex-row gap-6">
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full md:w-64 h-auto rounded-lg shadow-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                {movie.description && (
                  <p className="text-lg leading-relaxed">{movie.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-100">
            {streamUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={streamUrl}
                  title={movie.title}
                  className="absolute inset-0 w-full h-full rounded-lg shadow-2xl"
                  frameBorder="0"
                  allow="fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-center text-gray-600">
                No streaming URL provided for this movie.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminMoviePlayer;

