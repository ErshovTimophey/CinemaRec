import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const Reviews = ({ email }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [modalState, setModalState] = useState(null); // null, { type: 'view', review }, or { type: 'edit', review }
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newReview, setNewReview] = useState({
    movieTitle: '',
    rating: 1,
    text: '',
    images: [],
  });
  const [currentImagesToDelete, setCurrentImagesToDelete] = useState([]); // URLs to delete in edit mode
  const [imageError, setImageError] = useState(''); // Error message for image validation
  const [lightboxOpen, setLightboxOpen] = useState(false); // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(0); // Current image index

  // Блокировка прокрутки фона страницы при открытии полноэкранного окна
  useEffect(() => {
    if (modalState) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden'); // Очистка при размонтировании
  }, [modalState]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('http://localhost:8085/reviews');
        console.log('Fetched reviews:', response.data);
        setReviews(response.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview({ ...newReview, [name]: value });
    setImageError(''); // Clear image error on input change
  };

  const handleFileChange = (e, isEditMode = false) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const maxTotalSize = 15 * 1024 * 1024; // 15MB

    const currentImageCount = isEditMode
      ? (modalState.review.imageUrls?.length || 0) - currentImagesToDelete.length
      : 0;
    const existingImages = isEditMode ? newReview.images : newReview.images;
    const totalNewImages = existingImages.length + files.length;

    if (currentImageCount + totalNewImages > maxImages) {
      setImageError(`Cannot upload more than ${maxImages} images.`);
      return;
    }

    const invalidFiles = files.filter((file) => file.size > maxFileSize);
    if (invalidFiles.length > 0) {
      setImageError('Each image must be 5MB or smaller.');
      return;
    }

    const totalSize =
      files.reduce((sum, file) => sum + file.size, 0) +
      existingImages.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxTotalSize) {
      setImageError('Total size of all images must be 15MB or smaller.');
      return;
    }

    setImageError('');
    setNewReview({ ...newReview, images: [...existingImages, ...files] });
  };

  const removeImage = (index, isCurrent = false) => {
    if (isCurrent) {
      const url = modalState.review.imageUrls[index];
      setCurrentImagesToDelete([...currentImagesToDelete, url]);
    } else {
      setNewReview({
        ...newReview,
        images: newReview.images.filter((_, i) => i !== index),
      });
    }
    setImageError('');
  };

  const handleSubmitReview = async (e, isEditMode = false) => {
      e.preventDefault();
      setImageError('');
      try {
        const formData = new FormData();
        formData.append('movieTitle', newReview.movieTitle);
        formData.append('rating', newReview.rating);
        formData.append('text', newReview.text);
        formData.append('userEmail', email);
        newReview.images.forEach((image) => formData.append('images', image));

        // Add deletedImageUrls for edit mode if there are images to delete
        if (isEditMode && currentImagesToDelete.length > 0) {
          formData.append('deletedImageUrls', JSON.stringify(currentImagesToDelete));
        }

        let response;
        if (isEditMode) {
          console.log('Submitting edit for review ID:', modalState.review.id, 'with deleted images:', currentImagesToDelete);
          response = await axios.put(
            `http://localhost:8085/reviews/${modalState.review.id}?email=${email}`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
          setReviews(reviews.map((r) => (r.id === modalState.review.id ? response.data : r)));
        } else {
          console.log('Submitting new review');
          response = await axios.post(`http://localhost:8085/reviews?email=${email}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setReviews([response.data, ...reviews]);
        }

        setShowForm(false);
        setModalState(null);
        setNewReview({ movieTitle: '', rating: 1, text: '', images: [] });
        setCurrentImagesToDelete([]);
      } catch (error) {
        console.error('Error submitting review:', error.response?.data || error.message);
        if (error.response?.status === 400) {
          toast.error('Invalid review data');
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to perform this action');
        } else if (error.response?.status === 404) {
          toast.error('Review not found');
        } else if (error.response?.status === 413) {
          setImageError('One or more files are too large. Each file must be 5MB or smaller.');
          toast.error('Failed to submit: One or more files are too large.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to submit review');
        }
      }
  };

  const handleEditReview = (review) => {
    if (review.userEmail !== email) {
      return;
    }
    if (!review.id) {
      console.error('Review ID is missing:', review);
      return;
    }
    console.log('Opening edit modal for review ID:', review.id);
    setNewReview({
      movieTitle: review.movieTitle,
      rating: review.rating,
      text: review.text,
      images: [],
    });
    setCurrentImagesToDelete([]);
    setImageError('');
    setModalState({ type: 'edit', review });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) {
      console.error('Review ID is missing for delete');
      return;
    }
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) {
      console.error('Review not found for ID:', reviewId);
      return;
    }
    if (review.userEmail !== email) {
      return;
    }
    try {
      console.log('Deleting review ID:', reviewId);
      await axios.delete(`http://localhost:8085/reviews/${reviewId}?email=${email}`);
      setReviews(reviews.filter((r) => r.id !== reviewId));
      setModalState(null);
    } catch (error) {
      console.error('Error deleting review:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        toast.error('Invalid review ID');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to delete this review');
      } else if (error.response?.status === 404) {
        toast.error('Review not found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete review');
      }
    }
  };

  const filteredReviews = reviews
    .filter((review) => (selectedTab === 'your' ? review.userEmail === email : true))
    .filter((review) => review.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()));

  const lightboxImages = modalState?.type === 'view' && modalState.review.imageUrls
    ? modalState.review.imageUrls.map((url) => ({ src: url }))
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Полноэкранное окно для view/edit
  if (modalState) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white flex flex-col h-screen w-screen overflow-y-auto scrollbar-thin z-50"
      >
        {/* Контейнер содержимого */}
        <div className="flex-1 p-6">
          {modalState.type === 'view' && (
            <>
              <h3 className="text-2xl font-bold mb-4">{modalState.review.movieTitle}</h3>
              <div className="flex items-center mb-4">
                {[...Array(10)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`text-lg ${i < modalState.review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2">{modalState.review.rating}/10</span>
              </div>
              <p className="text-gray-600 mb-4">by {modalState.review.userEmail}</p>
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-line">{modalState.review.text}</p>
              </div>
              {modalState.review.imageUrls?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {modalState.review.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={`http://localhost:8087/quizzes/proxy?url=${encodeURIComponent(url)}`}
                        alt={`${modalState.review.movieTitle}-${index}`}
                        className="w-full h-40 object-contain rounded cursor-pointer"
                        onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                        onClick={() => {
                          setLightboxOpen(true);
                          setLightboxIndex(index);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {modalState.type === 'edit' && (
            <>
              <h3 className="text-2xl font-bold mb-4">Edit Review</h3>
              <form onSubmit={(e) => handleSubmitReview(e, true)}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Movie Title</label>
                  <input
                    type="text"
                    name="movieTitle"
                    value={newReview.movieTitle}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Rating</label>
                  <div className="flex items-center">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-xl cursor-pointer ${
                          i < newReview.rating ? 'text-yellow-500' : 'text-gray-300'
                        } hover:text-yellow-400 transition`}
                        onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                      />
                    ))}
                    <span className="ml-2">{newReview.rating}/10</span>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Review Text</label>
                  <textarea
                    name="text"
                    value={newReview.text}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                    style={{ height: 'auto' }} // Автоматическая высота
                    rows={Math.max(4, Math.ceil(newReview.text.split('\n').length))} // Минимальная высота 4 строки, подстраивается под текст
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Current Images (Up to 5 total, Max 5MB each, 15MB total)
                  </label>
                  {modalState.review.imageUrls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {modalState.review.imageUrls
                        .filter((url) => !currentImagesToDelete.includes(url))
                        .map((url, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={`http://localhost:8087/quizzes/proxy?url=${encodeURIComponent(url)}`}
                              alt={`${modalState.review.movieTitle}-${index}`}
                              className="w-full h-40 object-contain rounded cursor-pointer"
                              onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                              onClick={() => {
                                setLightboxOpen(true);
                                setLightboxIndex(index);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, true)}
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
                            >
                              X
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  <label className="block text-gray-700 mb-2">Add New Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, true)}
                    className={`w-full p-2 border rounded ${
                      imageError ? 'border-red-500' : ''
                    } focus:ring-2 focus:ring-purple-500`}
                    disabled={
                      (modalState.review.imageUrls?.length || 0) -
                        currentImagesToDelete.length +
                        newReview.images.length >=
                      5
                    }
                  />
                  {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                  {newReview.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {newReview.images.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={URL.createObjectURL(image)}
                            alt="Preview"
                            className="w-full h-40 object-contain rounded cursor-pointer"
                            onClick={() => {
                              setLightboxOpen(true);
                              setLightboxIndex(index);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end space-x-2">
          {modalState.type === 'edit' && (
            <>
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-purple-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={(e) => handleSubmitReview(e, true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 transition"
              >
                Save
              </button>
            </>
          )}
          <button
            onClick={() => setModalState(null)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-purple-500 transition"
          >
            Close
          </button>
        </div>

        {/* Lightbox для просмотра изображений */}
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={modalState?.type === 'view' ? lightboxImages : newReview.images.map((img) => ({ src: `http://localhost:8087/quizzes/proxy?url=${img}` }))}
            index={lightboxIndex}
            styles={{ container: { zIndex: 60 } }}
          />
        )}
      </motion.div>
    );
  }

  // Основной интерфейс со списком рецензий
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Movie Reviews</h2>
        <button
          onClick={() => {
            setNewReview({ movieTitle: '', rating: 1, text: '', images: [] });
            setShowForm(!showForm);
            setModalState(null);
            setImageError('');
          }}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 transition"
        >
          <FaPlus className="mr-2" />
          Add Review
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 rounded-lg ${
            selectedTab === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          } focus:ring-2 focus:ring-purple-500 transition`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setSelectedTab('your')}
          className={`px-4 py-2 rounded-lg ${
            selectedTab === 'your' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          } focus:ring-2 focus:ring-purple-500 transition`}
        >
          Your Reviews
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by movie title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Форма для добавления новой рецензии */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-8 p-6 bg-white rounded-lg shadow"
        >
          <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Movie Title</label>
              <input
                type="text"
                name="movieTitle"
                value={newReview.movieTitle}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <div className="flex items-center">
                {[...Array(10)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`text-xl cursor-pointer ${
                      i < newReview.rating ? 'text-yellow-500' : 'text-gray-300'
                    } hover:text-yellow-400 transition`}
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                  />
                ))}
                <span className="ml-2">{newReview.rating}/10</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Review Text</label>
              <textarea
                name="text"
                value={newReview.text}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                rows="8"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Images (Up to 5, Max 5MB each, 15MB total)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className={`w-full p-2 border rounded ${
                  imageError ? 'border-red-500' : ''
                } focus:ring-2 focus:ring-purple-500`}
                disabled={newReview.images.length >= 5}
              />
              {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
              <div className="flex flex-wrap mt-2 gap-2">
                {newReview.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Preview"
                      className="w-24 h-24 object-contain rounded cursor-pointer"
                      onClick={() => {
                        setLightboxOpen(true);
                        setLightboxIndex(index);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-purple-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 transition"
              >
                Submit Review
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Сетка рецензий */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchQuery ? 'No reviews match your search.' : 'No reviews yet. Be the first to add one!'}
          </div>
        ) : (
          filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setModalState({ type: 'view', review })}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer"
            >
              <div className="p-4">
                {review.imageUrls && review.imageUrls.length > 0 && (
                  <img
                    src={`http://localhost:8087/quizzes/proxy?url=${review.imageUrls[0]}`}
                    alt={`${review.movieTitle}-preview`}
                    className="w-full h-24 object-contain rounded mb-2 cursor-pointer"
                    onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                      setLightboxIndex(0);
                    }}
                  />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold truncate">{review.movieTitle}</h3>
                  <div className="flex items-center">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-xs ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">by {review.userEmail}</p>
                <p className="text-gray-700 text-sm line-clamp-5">{review.text}</p>
                {review.userEmail === email && (
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditReview(review);
                      }}
                      className="flex items-center px-2 py-1 text-purple-600 hover:text-purple-800 focus:ring-2 focus:ring-purple-500"
                    >
                      <FaEdit className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReview(review.id);
                      }}
                      className="flex items-center px-2 py-1 text-red-600 hover:text-red-800 focus:ring-2 focus:ring-purple-500"
                    >
                      <FaTrash className="mr-1" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;