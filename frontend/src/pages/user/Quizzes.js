import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrophy, FaCheck, FaTimes, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Quizzes = ({ email }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [solidScore, setSolidScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editQuizId, setEditQuizId] = useState(null);
    const [pastResults, setPastResults] = useState([]);
    const [newQuiz, setNewQuiz] = useState({
        title: '',
        description: '',
        questions: [{ text: '', image: null, answers: ['', '', '', ''], correctAnswer: 0 }]
    });
    const [editQuiz, setEditQuiz] = useState({
        title: '',
        description: '',
        questions: [{ text: '', image: null, answers: ['', '', '', ''], correctAnswer: 0 }]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!email) {
                    throw new Error('No user email provided');
                }
                // Fetch all quizzes
                const quizzesResponse = await axios.get(`http://localhost:8087/quizzes`);
                setQuizzes(quizzesResponse.data);
                // Fetch past results
                const resultsResponse = await axios.get(`http://localhost:8087/quizzes/results?email=${email}`);
                const sortedResults = resultsResponse.data
                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                    .slice(0, 4);
                setPastResults(sortedResults);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'Failed to load quizzes');
                setLoading(false);
            }
        };

        fetchData();
    }, [email]);

    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setScore(0);
        setQuizCompleted(false);
        setAnswerFeedback(null);
    };

    const handleAnswerSelect = (answerIndex) => {
        setSelectedAnswer(answerIndex);
        setAnswerFeedback(null);
    };

    const submitAnswer = () => {
        if (selectedAnswer === null) return;

        const isCorrect = activeQuiz.questions[currentQuestion].correctAnswer === selectedAnswer;
        setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            setScore(prevScore => {
                const newScore = prevScore + 1;
                console.log('Updated score:', newScore); // Log score update
                return newScore;
            });
        }

        if (currentQuestion < activeQuiz.questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
                setAnswerFeedback(null);
            }, 1000);
        } else {
            setQuizCompleted(true);
            // Call saveQuizResult synchronously with current score
            setSolidScore(score + (isCorrect ? 1 : 0));
            saveQuizResult();
        }
    };

    const saveQuizResult = async () => {
        try {
            if (!email) {
                throw new Error('No user email provided');
            }
            console.log('Saving quiz result with score:', score, 'for quiz ID:', activeQuiz.id);
            const response = await axios.post(`http://localhost:8087/quizzes/results?email=${encodeURIComponent(email)}`, {
                quizId: activeQuiz.id,
                score: solidScore,
                totalQuestions: activeQuiz.questions.length
            });
            console.log('Received response:', response.data);
            const updatedResults = [
                response.data,
                ...pastResults
            ].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
             .slice(0, 4);
            setPastResults(updatedResults);
            toast.success('Quiz result saved successfully');
        } catch (error) {
            console.error('Error saving quiz result:', error);
            toast.error(error.message || 'Failed to save quiz result');
        }
    };

    const resetQuiz = () => {
        setActiveQuiz(null);
        setAnswerFeedback(null);
    };

    const handleCreateQuizChange = (field, value) => {
        setNewQuiz({ ...newQuiz, [field]: value });
    };

    const handleEditQuizChange = (field, value) => {
        setEditQuiz({ ...editQuiz, [field]: value });
    };

    const handleQuestionChange = (index, field, value, isEdit = false) => {
        const quizState = isEdit ? editQuiz : newQuiz;
        const setQuizState = isEdit ? setEditQuiz : setNewQuiz;
        const updatedQuestions = [...quizState.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuizState({ ...quizState, questions: updatedQuestions });
    };

    const handleAnswerChange = (qIndex, aIndex, value, isEdit = false) => {
        const quizState = isEdit ? editQuiz : newQuiz;
        const setQuizState = isEdit ? setEditQuiz : setNewQuiz;
        const updatedQuestions = [...quizState.questions];
        updatedQuestions[qIndex].answers[aIndex] = value;
        setQuizState({ ...quizState, questions: updatedQuestions });
    };

    const addQuestion = (isEdit = false) => {
        const quizState = isEdit ? editQuiz : newQuiz;
        const setQuizState = isEdit ? setEditQuiz : setNewQuiz;
        setQuizState({
            ...quizState,
            questions: [...quizState.questions, { text: '', image: null, answers: ['', '', '', ''], correctAnswer: 0 }]
        });
    };

    const removeQuestion = (index, isEdit = false) => {
        const quizState = isEdit ? editQuiz : newQuiz;
        const setQuizState = isEdit ? setEditQuiz : setNewQuiz;
        setQuizState({
            ...quizState,
            questions: quizState.questions.filter((_, i) => i !== index)
        });
    };

    const handleImageChange = (index, file, isEdit = false) => {
        const quizState = isEdit ? editQuiz : newQuiz;
        const setQuizState = isEdit ? setEditQuiz : setNewQuiz;
        const updatedQuestions = [...quizState.questions];
        updatedQuestions[index].image = file;
        setQuizState({ ...quizState, questions: updatedQuestions });
    };

    const submitQuiz = async (e) => {
        e.preventDefault();
        try {
            if (!email) {
                throw new Error('No user email provided');
            }
            const formData = new FormData();
            formData.append('title', newQuiz.title);
            formData.append('description', newQuiz.description);
            newQuiz.questions.forEach((q, index) => {
                formData.append(`questions[${index}].text`, q.text);
                if (q.image) {
                    formData.append(`questions[${index}].image`, q.image);
                }
                q.answers.forEach((answer, aIndex) => {
                    formData.append(`questions[${index}].answers[${aIndex}]`, answer);
                });
                formData.append(`questions[${index}].correctAnswer`, q.correctAnswer);
            });

            const response = await axios.post(`http://localhost:8087/quizzes?email=${email}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setQuizzes([...quizzes, response.data]);
            setNewQuiz({
                title: '',
                description: '',
                questions: [{ text: '', image: null, answers: ['', '', '', ''], correctAnswer: 0 }]
            });
            setShowCreateForm(false);
            toast.success('Quiz created successfully');
        } catch (error) {
            console.error('Error creating quiz:', error);
            toast.error(error.message || 'Failed to create quiz');
        }
    };

    const startEditQuiz = (quiz) => {
        setEditQuiz({
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions.map(q => ({
                text: q.text,
                image: null, // Image re-upload required
                answers: [...q.answers],
                correctAnswer: q.correctAnswer
            }))
        });
        setEditQuizId(quiz.id);
        setShowEditForm(true);
    };

    const submitEditQuiz = async (e) => {
        e.preventDefault();
        try {
            if (!email) {
                throw new Error('No user email provided');
            }
            const formData = new FormData();
            formData.append('title', editQuiz.title);
            formData.append('description', editQuiz.description);
            editQuiz.questions.forEach((q, index) => {
                formData.append(`questions[${index}].text`, q.text);
                if (q.image) {
                    formData.append(`questions[${index}].image`, q.image);
                }
                q.answers.forEach((answer, aIndex) => {
                    formData.append(`questions[${index}].answers[${aIndex}]`, answer);
                });
                formData.append(`questions[${index}].correctAnswer`, q.correctAnswer);
            });

            const response = await axios.put(`http://localhost:8087/quizzes/${editQuizId}?email=${email}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setQuizzes(quizzes.map(q => q.id === editQuizId ? response.data : q));
            setEditQuiz({
                title: '',
                description: '',
                questions: [{ text: '', image: null, answers: ['', '', '', ''], correctAnswer: 0 }]
            });
            setShowEditForm(false);
            setEditQuizId(null);
            toast.success('Quiz updated successfully');
        } catch (error) {
            console.error('Error updating quiz:', error);
            toast.error(error.message || 'Failed to update quiz');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (activeQuiz) {
        const question = activeQuiz.questions[currentQuestion];

        return (
            <div className="max-w-2xl mx-auto">
                {quizCompleted ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-8 rounded-lg shadow text-center"
                    >
                        <div className="text-6xl text-yellow-500 flex justify-center mb-4">
                            <FaTrophy />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
                        <p className="text-xl mb-6">
                            Your score: {score} out of {activeQuiz.questions.length}
                        </p>
                        <div className="mb-6">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-purple-600 h-4 rounded-full"
                                    style={{ width: `${(score / activeQuiz.questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <button
                            onClick={resetQuiz}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Back to Quizzes
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white p-6 rounded-lg shadow"
                    >
                        <div className="mb-4 flex justify-between">
                            <span className="text-gray-600">
                                Question {currentQuestion + 1} of {activeQuiz.questions.length}
                            </span>
                            <span className="font-semibold">
                                Score: {score}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-6">{question.text}</h3>

                        {question.imageUrl && (
                            <div className="mb-6">
                                <img
                                    src={question.imageUrl}
                                    alt="Question visual"
                                    className="max-h-48 mx-auto rounded"
                                    onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                                />
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            {question.answers.map((answer, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    className={`p-4 border rounded-lg cursor-pointer transition flex items-center justify-between
                                        ${selectedAnswer === index ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'}
                                        ${answerFeedback && selectedAnswer === index ? (answerFeedback === 'correct' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                                >
                                    <span>{answer}</span>
                                    {answerFeedback && selectedAnswer === index && (
                                        answerFeedback === 'correct' ? (
                                            <FaCheck className="text-green-500" />
                                        ) : (
                                            <FaTimes className="text-red-500" />
                                        )
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={submitAnswer}
                            disabled={selectedAnswer === null}
                            className={`w-full py-3 rounded-lg transition ${selectedAnswer === null ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        >
                            {currentQuestion < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Movie Quizzes</h2>

            {/* Create Quiz Button */}
            <div className="mb-6">
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                >
                    <FaPlus className="mr-2" />
                    {showCreateForm ? 'Cancel' : 'Create New Quiz'}
                </button>
            </div>

            {/* Quiz Creation Form */}
            {showCreateForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow mb-6"
                >
                    <h3 className="text-xl font-bold mb-4">Create a New Quiz</h3>
                    <form onSubmit={submitQuiz}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={newQuiz.title}
                                onChange={(e) => handleCreateQuizChange('title', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                                value={newQuiz.description}
                                onChange={(e) => handleCreateQuizChange('description', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows="4"
                            ></textarea>
                        </div>
                        {newQuiz.questions.map((question, qIndex) => (
                            <div key={qIndex} className="border p-4 mb-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Question {qIndex + 1}</h4>
                                    {newQuiz.questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Question Text</label>
                                    <input
                                        type="text"
                                        value={question.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Image (optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(qIndex, e.target.files[0])}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                {question.answers.map((answer, aIndex) => (
                                    <div key={aIndex} className="mb-2">
                                        <label className="block text-gray-700 mb-1">Answer {aIndex + 1}</label>
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                ))}
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Correct Answer</label>
                                    <select
                                        value={question.correctAnswer}
                                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        {question.answers.map((_, index) => (
                                            <option key={index} value={index}>
                                                Answer {index + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addQuestion()}
                            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                            <FaPlus className="mr-2" />
                            Add Question
                        </button>
                        <button
                            type="submit"
                            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Create Quiz
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Quiz Edit Form */}
            {showEditForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow mb-6"
                >
                    <h3 className="text-xl font-bold mb-4">Edit Quiz</h3>
                    <form onSubmit={submitEditQuiz}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={editQuiz.title}
                                onChange={(e) => handleEditQuizChange('title', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                                value={editQuiz.description}
                                onChange={(e) => handleEditQuizChange('description', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows="4"
                            ></textarea>
                        </div>
                        {editQuiz.questions.map((question, qIndex) => (
                            <div key={qIndex} className="border p-4 mb-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Question {qIndex + 1}</h4>
                                    {editQuiz.questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex, true)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Question Text</label>
                                    <input
                                        type="text"
                                        value={question.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value, true)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Image (optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(qIndex, e.target.files[0], true)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                {question.answers.map((answer, aIndex) => (
                                    <div key={aIndex} className="mb-2">
                                        <label className="block text-gray-700 mb-1">Answer {aIndex + 1}</label>
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value, true)}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                ))}
                                <div className="mb-2">
                                    <label className="block text-gray-700 mb-1">Correct Answer</label>
                                    <select
                                        value={question.correctAnswer}
                                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value), true)}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        {question.answers.map((_, index) => (
                                            <option key={index} value={index}>
                                                Answer {index + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addQuestion(true)}
                            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                            <FaPlus className="mr-2" />
                            Add Question
                        </button>
                        <button
                            type="submit"
                            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Update Quiz
                        </button>
                    </form>
                </motion.div>
            )}

     

            {/* Available Quizzes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {quizzes.map(quiz => (
                    <motion.div
                        key={quiz.id}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg overflow-hidden shadow-lg"
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                            <p className="text-gray-600 mb-2">{quiz.description}</p>
                            <p className="text-sm text-gray-500 mb-4">Created by: {quiz.creatorEmail}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {quiz.questions.length} questions
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => startQuiz(quiz)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                    >
                                        Start Quiz
                                    </button>
                                    {quiz.creatorEmail === email && (
                                        <button
                                            onClick={() => startEditQuiz(quiz)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <FaEdit />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Quizzes;