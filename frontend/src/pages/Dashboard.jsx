import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const Dashboard = () => {
    const { user, api } = useAuth(); // Use api from context to get headers

    // Example query (we might need a dashboard endpoint later, but for now lets just show static/user data)
    // TODO: Create /api/admin/dashboard-stats endpoint

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, {user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Appointments"
                    value="1,240"
                    icon={Calendar}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Customers"
                    value="850"
                    icon={Users}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Points Awarded"
                    value="45,200"
                    icon={Trophy}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Monthly Revenue"
                    value="$12,450"
                    icon={TrendingUp}
                    color="bg-orange-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Appointments</h3>
                <div className="text-center py-10 text-gray-400">
                    placeholder for table
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
