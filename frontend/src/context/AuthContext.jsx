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
            console.log("Fetching profile for:", authUser.email);
            console.log("Step 1: Checking Super Admin...");

            // 0. Check Super Admin (DIRECT TABLE QUERY - NO RPC)
            console.log("Step 1: Checking Super Admin (Direct Table)...");
            let isSuperAdmin = false;
            try {
                const { data: adminData, error: adminError } = await supabase
                    .from('super_admins')
                    .select('user_id')
                    .eq('user_id', authUser.id)
                    .maybeSingle();

                if (adminError) {
                    console.error("Super Admin Check Error (Non-blocking):", adminError);
                } else if (adminData) {
                    isSuperAdmin = true;
                    console.log("Super Admin Verified ✅");
                }
            } catch (err) {
                console.error("Super Admin Check Exception:", err);
                isSuperAdmin = false; // Fallback to avoid blank screen
            }



            // 1. Try 'business_users' (Admin/Owners)
            console.log("Step 2: Checking business_users...");
            const { data: profile, error } = await supabase
                .from('business_users')
                .select('*')
                .eq('email', authUser.email)
                .maybeSingle();

            if (error) console.error("Error fetching business_user:", error);
            if (profile) console.log("Found business profile:", profile);
            else console.log("No business profile found.");

            if (profile) {
                // 1. Fetch Subscription
                console.log("Step 3: Fetching Subscription...");
                const { data: subscription, error: subError } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('business_id', profile.business_id)
                    .maybeSingle();

                console.log("Step 3 Result: Subscription found?", !!subscription);

                if (subError) console.error("Error fetching subscription:", subError);

                let subStatus = 'inactive';
                let daysRemaining = 0;

                if (subscription) {
                    const now = new Date();
                    const end = new Date(subscription.current_period_end);
                    const diffTime = end - now;
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (subscription.status === 'active' && daysRemaining > 0) {
                        subStatus = 'active';
                    } else if (subscription.status === 'past_due' || daysRemaining <= 0) {
                        subStatus = 'expired';
                    }
                } else {
                    // FIX: If no subscription exists for an existing business, give them a courtesy trial or mark specifically
                    console.log("No subscription found for existing business. Defaulting to Inactive.");
                }

                setUser({
                    ...authUser,
                    ...profile,
                    role: 'admin',
                    isSuperAdmin, // Add this flag
                    subscription: {
                        ...subscription,
                        status: subStatus,
                        daysRemaining
                    }
                });
            } else {
                // 2. Try 'employees' (Barbers/Staff) linked by user_id or email
                console.log("No business_user found. Step 4: Checking employees...");
                const { data: employee, error: empError } = await supabase
                    .from('employees')
                    .select('*')
                    .or(`user_id.eq.${authUser.id},email.eq.${authUser.email}`)
                    .maybeSingle();

                if (empError) console.error("Error fetching employee:", empError);

                if (employee) {
                    // If linked by email but not user_id yet, update user_id
                    if (!employee.user_id) {
                        await supabase.from('employees').update({ user_id: authUser.id }).eq('id', employee.id);
                    }

                    setUser({
                        ...authUser,
                        business_id: employee.business_id,
                        role: 'barber',
                        employee_id: employee.id,
                        name: employee.first_name
                    });
                } else {
                    // No profile found
                    console.log('No business profile found for', authUser.email);
                    setUser(authUser);
                }
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

    const register = async (email, password, businessName, subdomain, firstName, lastName) => {
        try {
            // 1. Sign Up in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Create Business (if name provided)
            if (businessName) {
                // Generate slug if invalid
                let finalSlug = subdomain;
                if (!finalSlug) {
                    finalSlug = businessName
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                }

                // Ensure Uniqueness (Simple check loop)
                let isUnique = false;
                let suffix = 0;
                let checkSlug = finalSlug;

                while (!isUnique && suffix < 10) { // Limit retry to avoid infinite loops
                    const { data: existing } = await supabase
                        .from('businesses')
                        .select('id')
                        .eq('subdomain', checkSlug)
                        .maybeSingle();

                    if (!existing) {
                        isUnique = true;
                        finalSlug = checkSlug;
                    } else {
                        suffix++;
                        checkSlug = `${finalSlug}-${suffix}`;
                    }
                }

                if (!isUnique) throw new Error("Could not generate a unique business URL. Please choose another.");

                const { data: business, error: busError } = await supabase
                    .from('businesses')
                    .insert({
                        name: businessName,
                        subdomain: finalSlug,
                        email: email, // Added email field
                        gamification_enabled: true
                    })
                    .select('id')
                    .single();

                if (busError) throw busError;

                // 3. Create Profile in business_users
                await supabase.from('business_users').insert({
                    business_id: business.id,
                    email: email,
                    role: 'owner',
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`.trim()
                });

                // 4. Seed Default Data (Services & Rewards)
                const defaultServices = [
                    { name: 'Corte Clásico', price: 10000, duration_minutes: 30, points_reward: 10, description: 'Corte de cabello tradicional con tijera o máquina.' },
                    { name: 'Corte + Barba', price: 15000, duration_minutes: 45, points_reward: 20, description: 'Servicio completo de corte y perfilado de barba.' },
                    { name: 'Color / Mechas', price: 25000, duration_minutes: 90, points_reward: 50, description: 'Coloración profesional.' }
                ];

                await supabase.from('services').insert(
                    defaultServices.map(s => ({ ...s, business_id: business.id }))
                );

                const defaultRewards = [
                    { name: 'Corte Gratis', points_cost: 500, description: 'Canjea tus puntos por un corte sin cargo.' },
                    { name: '10% OFF', points_cost: 100, description: 'Descuento en tu próxima visita.' }
                ];

                await supabase.from('rewards').insert(
                    defaultRewards.map(r => ({ ...r, business_id: business.id }))
                );
            }

            // Check if session was created immediately (Email Confirm Disabled)
            if (authData.session) {
                toast.success('¡Cuenta creada correctamente!');
                return { success: true, autoLogin: true };
            } else {
                toast.success('¡Registro exitoso! Por favor verifica tu email.');
                return { success: true, autoLogin: false };
            }
        } catch (error) {
            toast.error(error.message || 'Error al registrarse');
            return { success: false };
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
