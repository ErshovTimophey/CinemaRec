import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { FaArrowLeft, FaPlay, FaStar, FaClock, FaCalendarAlt, FaFilm, FaExternalLinkAlt, FaYoutube } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const MoviePlayer = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const playerRef = useRef(null);
  
  const [movieDetails, setMovieDetails] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!movieId || !email) {
      setError('Movie ID or email is missing');
      setLoading(false);
      return;
    }

    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching movie details for movieId:', movieId, 'email:', email);
        
        // Fetch movie details
        const detailsResponse = await axios.get(
          `http://localhost:8088/statistics/movies/${movieId}?email=${encodeURIComponent(email)}`
        );
        
        console.log('Movie details response:', detailsResponse.data);
        
        if (!detailsResponse.data || !detailsResponse.data.id) {
          throw new Error('Movie details not found or invalid');
        }
        
        setMovieDetails(detailsResponse.data);

        // Fetch movie videos (this is optional, so we don't fail if it errors)
        try {
          const videosUrl = `http://localhost:8088/statistics/movies/${movieId}/videos?email=${encodeURIComponent(email)}`;
          console.log('Fetching videos from URL:', videosUrl);
          
          const videosResponse = await axios.get(videosUrl);
          const fetchedVideos = videosResponse.data || [];
          console.log('Movie videos response:', fetchedVideos);
          console.log('Number of videos found:', fetchedVideos.length);
          
          setVideos(fetchedVideos);
          
          // Auto-select first trailer if available
          if (fetchedVideos.length > 0) {
            console.log('Selecting first video:', fetchedVideos[0]);
            setSelectedVideo(fetchedVideos[0]);
            // Auto-play first video after a short delay
            setTimeout(() => {
              setPlaying(true);
            }, 500);
          } else {
            console.warn('No videos found for movieId:', movieId);
          }
        } catch (videoErr) {
          console.error('Error fetching videos (non-critical):', videoErr);
          console.error('Error details:', {
            message: videoErr.message,
            response: videoErr.response?.data,
            status: videoErr.response?.status,
            url: videoErr.config?.url
          });
          setVideos([]); // Set empty array if videos fail to load
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching movie data:', err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           `Failed to load movie data. Status: ${err.response?.status || 'Unknown'}`;
        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage);
      }
    };

    fetchMovieData();
  }, [movieId, email]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setPlaying(false);
    setVideoReady(false);
    // Auto-play after video is ready
    setTimeout(() => {
      setPlaying(true);
    }, 300);
  };

  const handleOpenYouTube = () => {
    if (selectedVideo?.key) {
      window.open(`https://www.youtube.com/watch?v=${selectedVideo.key}`, '_blank');
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  // Filter videos by type
  const trailers = videos.filter(v => v.type === 'Trailer');
  const teasers = videos.filter(v => v.type === 'Teaser');
  const otherVideos = videos.filter(v => v.type !== 'Trailer' && v.type !== 'Teaser');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error || !movieDetails) {
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

  const videoUrl = selectedVideo 
    ? `https://www.youtube.com/watch?v=${selectedVideo.key}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
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
          {/* Movie Info Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex flex-col md:flex-row gap-6">
              {movieDetails.posterPath && (
                <img
                  src={`http://localhost:8088/tmdb/movies/${movieId}/poster`}
                  alt={movieDetails.title}
                  className="w-full md:w-64 h-auto rounded-lg shadow-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{movieDetails.title}</h1>
                <div className="flex flex-wrap gap-4 mb-4">
                  {movieDetails.voteAverage && (
                    <div className="flex items-center">
                      <FaStar className="text-yellow-300 mr-2" />
                      <span className="font-semibold">{movieDetails.voteAverage.toFixed(1)}</span>
                    </div>
                  )}
                  {movieDetails.runtime && (
                    <div className="flex items-center">
                      <FaClock className="mr-2" />
                      <span>{movieDetails.runtime} min</span>
                    </div>
                  )}
                  {movieDetails.releaseDate && (
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      <span>{movieDetails.releaseDate}</span>
                    </div>
                  )}
                </div>
                {movieDetails.genres && movieDetails.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movieDetails.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                {movieDetails.overview && (
                  <p className="text-lg leading-relaxed">{movieDetails.overview}</p>
                )}
              </div>
            </div>
          </div>

          {/* Video Player Section */}
          <div className="p-6">
            {videos.length > 0 ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <FaFilm className="mr-2 text-purple-600" />
                    Trailers & Videos
                  </h2>
                  
                  {/* Video Player */}
                  {selectedVideo && (
                    <div className="mb-6">
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <div className="absolute inset-0 bg-black rounded-lg overflow-hidden shadow-2xl">
                          {!videoReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
                                <p className="text-white text-sm">Loading video...</p>
                              </div>
                            </div>
                          )}
                          <ReactPlayer
                            ref={playerRef}
                            url={videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing={playing}
                            onReady={() => setVideoReady(true)}
                            onError={(e) => {
                              console.error('Video player error:', e);
                              toast.error('Video load error');
                            }}
                            className="react-player"
                            config={{
                              youtube: {
                                playerVars: {
                                  autoplay: playing ? 1 : 0,
                                  rel: 0,
                                  modestbranding: 1,
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800 font-semibold text-lg">{selectedVideo.name}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            {selectedVideo.type} • {selectedVideo.site}
                          </p>
                        </div>
                        <button
                          onClick={handleOpenYouTube}
                          className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center transition shadow-lg"
                          title="Open on YouTube"
                        >
                          <FaYoutube className="mr-2" />
                          <span className="hidden sm:inline">YouTube</span>
                          <FaExternalLinkAlt className="ml-2 text-xs" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Video List - Organized by Type */}
                  {videos.length > 1 && (
                    <div className="space-y-6">
                      {/* Trailers Section */}
                      {trailers.length > 1 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <FaFilm className="mr-2 text-purple-600" />
                            Trailers ({trailers.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trailers.map((video) => (
                              <motion.div
                                key={video.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleVideoSelect(video)}
                                className={`cursor-pointer rounded-lg overflow-hidden shadow-lg transition ${
                                  selectedVideo?.id === video.id
                                    ? 'ring-4 ring-purple-500'
                                    : 'hover:shadow-xl'
                                }`}
                              >
                                <div className="relative">
                                  <img
                                    src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                                    alt={video.name}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <FaPlay className="text-white text-4xl" />
                                  </div>
                                  {selectedVideo?.id === video.id && (
                                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                      Playing
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 bg-gray-100">
                                  <p className="font-semibold text-sm">{video.name}</p>
                                  <p className="text-xs text-gray-500">{video.type}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teasers Section */}
                      {teasers.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <FaFilm className="mr-2 text-blue-600" />
                            Teasers ({teasers.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teasers.map((video) => (
                              <motion.div
                                key={video.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleVideoSelect(video)}
                                className={`cursor-pointer rounded-lg overflow-hidden shadow-lg transition ${
                                  selectedVideo?.id === video.id
                                    ? 'ring-4 ring-purple-500'
                                    : 'hover:shadow-xl'
                                }`}
                              >
                                <div className="relative">
                                  <img
                                    src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                                    alt={video.name}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <FaPlay className="text-white text-4xl" />
                                  </div>
                                  {selectedVideo?.id === video.id && (
                                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                      Playing
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 bg-gray-100">
                                  <p className="font-semibold text-sm">{video.name}</p>
                                  <p className="text-xs text-gray-500">{video.type}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Videos Section */}
                      {otherVideos.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3 flex items-center">
                            <FaFilm className="mr-2 text-gray-600" />
                            Other videos ({otherVideos.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {otherVideos.map((video) => (
                              <motion.div
                                key={video.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleVideoSelect(video)}
                                className={`cursor-pointer rounded-lg overflow-hidden shadow-lg transition ${
                                  selectedVideo?.id === video.id
                                    ? 'ring-4 ring-purple-500'
                                    : 'hover:shadow-xl'
                                }`}
                              >
                                <div className="relative">
                                  <img
                                    src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                                    alt={video.name}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <FaPlay className="text-white text-4xl" />
                                  </div>
                                  {selectedVideo?.id === video.id && (
                                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                      Playing
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 bg-gray-100">
                                  <p className="font-semibold text-sm">{video.name}</p>
                                  <p className="text-xs text-gray-500">{video.type}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaFilm className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Videos unavailable
                </h3>
                <p className="text-gray-500 mb-4">
                  No trailers or videos available for this movie.
                </p>
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MoviePlayer;
