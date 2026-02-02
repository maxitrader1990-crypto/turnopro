import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const api = axios.create({
    baseURL: '/api' // Proxy handles host
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.data);

            // Set business ID for tenant isolation if exists
            if (res.data.data.business_id) {
                api.defaults.headers.common['x-business-id'] = res.data.data.business_id;
            }

        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, businessId) => {
        try {
            const res = await api.post('/auth/login', { email, password, business_id: businessId });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Set business context
            if (user.business_id) {
                api.defaults.headers.common['x-business-id'] = user.business_id;
            }

            setUser(user);
            toast.success('Welcome back!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        toast.success('Logged out');
    };

    const value = {
        user,
        loading,
        login,
        logout,
        api // Expose axios instance with interceptors
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
