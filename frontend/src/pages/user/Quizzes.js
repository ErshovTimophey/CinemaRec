import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrophy, FaCheck, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Quizzes = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8085/quizzes', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setQuizzes(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setScore(0);
        setQuizCompleted(false);
    };

    const handleAnswerSelect = (answerIndex) => {
        setSelectedAnswer(answerIndex);
    };

    const submitAnswer = () => {
        if (selectedAnswer === null) return;

        const isCorrect = activeQuiz.questions[currentQuestion].correctAnswer === selectedAnswer;
        if (isCorrect) {
            setScore(score + 1);
        }

        if (currentQuestion < activeQuiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
        } else {
            setQuizCompleted(true);
            saveQuizResult();
        }
    };

    const saveQuizResult = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8085/quizzes/results', {
                quizId: activeQuiz.id,
                score: score,
                totalQuestions: activeQuiz.questions.length
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    };

    const resetQuiz = () => {
        setActiveQuiz(null);
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
                                />
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            {question.answers.map((answer, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    className={`p-4 border rounded-lg cursor-pointer transition ${selectedAnswer === index ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
                                >
                                    {answer}
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
        <div>
            <h2 className="text-2xl font-bold mb-6">Movie Quizzes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map(quiz => (
                    <motion.div
                        key={quiz.id}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg overflow-hidden shadow-lg"
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                            <p className="text-gray-600 mb-4">{quiz.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {quiz.questions.length} questions
                                </span>
                                <button
                                    onClick={() => startQuiz(quiz)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Start Quiz
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Quizzes;