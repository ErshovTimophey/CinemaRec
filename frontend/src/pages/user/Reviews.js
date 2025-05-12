import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newReview, setNewReview] = useState({
        movieTitle: '',
        rating: 5,
        text: '',
        image: null
    });

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8084/reviews', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setReviews(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReview({
            ...newReview,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setNewReview({
            ...newReview,
            image: e.target.files[0]
        });
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('movieTitle', newReview.movieTitle);
            formData.append('rating', newReview.rating);
            formData.append('text', newReview.text);
            if (newReview.image) {
                formData.append('image', newReview.image);
            }

            const response = await axios.post('http://localhost:8084/reviews', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setReviews([response.data, ...reviews]);
            setShowForm(false);
            setNewReview({
                movieTitle: '',
                rating: 5,
                text: '',
                image: null
            });
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8084/reviews/${reviewId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setReviews(reviews.filter(review => review.id !== reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Movie Reviews</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <FaPlus className="mr-2" />
                    Add Review
                </button>
            </div>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Rating</label>
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        className={`text-2xl cursor-pointer ${i < newReview.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                        onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                                    />
                                ))}
                                <span className="ml-2">{newReview.rating}/5</span>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Review Text</label>
                            <textarea
                                name="text"
                                value={newReview.text}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                rows="4"
                                required
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Movie Image (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                Submit Review
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No reviews yet. Be the first to add one!
                    </div>
                ) : (
                    reviews.map(review => (
                        <motion.div
                            key={review.id}
                            whileHover={{ scale: 1.01 }}
                            className="bg-white rounded-lg shadow overflow-hidden"
                        >
                            {review.imageUrl && (
                                <img
                                    src={review.imageUrl}
                                    alt={review.movieTitle}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold">{review.movieTitle}</h3>
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-4">by {review.userName}</p>
                                <p className="text-gray-700 mb-4">{review.text}</p>
                                <div className="flex justify-end space-x-2">
                                    <button className="flex items-center px-3 py-1 text-purple-600 hover:text-purple-800">
                                        <FaEdit className="mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="flex items-center px-3 py-1 text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash className="mr-1" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Reviews;