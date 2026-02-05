import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await fetchBusinessProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchBusinessProfile(session.user);
            }
        } catch (error) {
            console.error('Session check error', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBusinessProfile = async (authUser) => {
        try {
            // Find business link
            // Try 'business_users' (our custom table)
            const { data: profile, error } = await supabase
                .from('business_users')
                .select('*')
                .eq('email', authUser.email)
                .single();

            if (profile) {
                setUser({ ...authUser, ...profile }); // Merge auth data with business data
            } else {
                // If no profile found, maybe they are just a raw auth user or need onboarding
                console.log('No business profile found for', authUser.email);
                setUser(authUser);
            }
        } catch (error) {
            console.error('Error fetching profile', error);
            setUser(authUser);
        }
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            toast.success('¡Bienvenido!');
            return true;
        } catch (error) {
            toast.error(error.message || 'Error al iniciar sesión');
            return false;
        }
    };

    const register = async (email, password, businessName) => {
        try {
            // 1. Sign Up in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Create Business (if name provided)
            if (businessName) {
                const { data: business, error: busError } = await supabase
                    .from('businesses')
                    .insert({ name: businessName })
                    .select('id')
                    .single();

                if (busError) throw busError;

                // 3. Create Profile in business_users
                await supabase.from('business_users').insert({
                    business_id: business.id,
                    email: email,
                    role: 'owner',
                    // password_hash: ... not needed if using Supabase Auth, but table might require it? Nullable?
                    // We'll leave it or put a placeholder if constraint exists.
                });
            }

            toast.success('¡Registro exitoso! Por favor verifica tu email.');
            return true;
        } catch (error) {
            toast.error(error.message || 'Error al registrarse');
            return false;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast.success('Sesión cerrada');
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        // Expose supabase client directly if needed, or helper
        api: null // We are removing `api` axios instance. Components should use `supabase` import.
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
