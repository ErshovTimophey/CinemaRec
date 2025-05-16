import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { FaFilm, FaUser, FaGlobe } from 'react-icons/fa';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8086/statistics', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching statistics:', error);
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!stats) {
        return <div>No statistics available</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Your Movie Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <FaFilm className="mr-2" /> Movies Watched
                    </h3>
                    <div className="text-4xl font-bold text-purple-600">
                        {stats.totalWatched}
                    </div>
                    <p className="text-gray-600 mt-2">Total movies you've watched</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <FaUser className="mr-2" /> Favorite Actors
                    </h3>
                    <div className="space-y-2">
                        {stats.topActors.map((actor, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{actor.name}</span>
                                <span className="font-semibold">{actor.count} movies</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">Genres Distribution</h3>
                    <div className="h-64">
                        <BarChart
                            width={500}
                            height={300}
                            data={stats.genreDistribution}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="genre" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="Movies watched" />
                        </BarChart>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <FaGlobe className="mr-2" /> Countries
                    </h3>
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
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.countryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;