import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        business_id: '' // For now, manually enter or hardcode for dev. Later: subdomain detection or select
    });

    // Dev helper: fetch businesses to pick from (in real app, subdomain handles this)
    // For this prototype, let's assume Super Admin or Business Owner knows their ID or we use a "Business Login" flow
    // SIMPLIFICATION: User enters Email/Pass and we can try to guess or just ask for Business ID if needed.
    // Let's rely on backend: Backend requires business_id.
    // We will simulate "Subdomain" by asking for it or hardcoding a test one.

    const handleSubmit = async (e) => {
        e.preventDefault();
        // business_id is actually the UUID. In a real app the subdomain maps to it.
        // For Phase 4 testing, we might need to query by name or just paste the UUID from DB.

        const success = await login(formData.email, formData.password, formData.business_id);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">TurnoPro Admin</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Business ID (UUID)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            placeholder="Paste Business ID from DB"
                            value={formData.business_id}
                            onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Temporary for dev. In prod, subdomain sets context.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
