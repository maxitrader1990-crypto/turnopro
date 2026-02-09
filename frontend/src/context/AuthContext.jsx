import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout: Ensure app loads even if everything else hangs
        const safetyTimeout = setTimeout(() => {
            setLoading((currentLoading) => {
                if (currentLoading) {
                    console.error("Safety Timeout Triggered: Forcing app load.");
                    return false;
                }
                return currentLoading;
            });
        }, 12000); // Increased to 12 seconds to account for multiple sequential timeouts

        // Check active session
        checkSession().finally(() => clearTimeout(safetyTimeout));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await fetchBusinessProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session?.user) {
                await fetchBusinessProfile(session.user);
            }
        } catch (error) {
            if (error.name === 'AbortError' || error.message.includes('AbortError')) {
                // Ignore fetch aborts
                console.log('Session check aborted via AbortController');
            } else {
                console.error('Session check error', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchBusinessProfile(session.user);
        }
    };

    const fetchBusinessProfile = async (authUser) => {
        try {
            console.log("Fetching profile for:", authUser.email);
            console.log("Step 1: Checking Super Admin...");
            // ... (rest of logic remains, verify end of function)


            // 0. Check Super Admin (DIRECT TABLE QUERY - NO RPC)
            // 0. Check Super Admin (DIRECT TABLE QUERY - NO RPC) with TIMEOUT
            console.log("Step 1: Checking Super Admin (Direct Table)...");
            let isSuperAdmin = false;
            try {
                // TIMEOUT SAFETY: Wrap the database call
                const checkSuperAdminPromise = supabase
                    .from('super_admins')
                    .select('user_id')
                    .eq('user_id', authUser.id)
                    .maybeSingle();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Super Admin Check Timed Out')), 5000)
                );

                const { data: adminData, error: adminError } = await Promise.race([
                    checkSuperAdminPromise,
                    timeoutPromise
                ]);

                if (adminError) {
                    console.error("Super Admin Check Error (Non-blocking):", adminError);
                } else if (adminData) {
                    isSuperAdmin = true;
                    console.log("Super Admin Verified ✅");
                }
            } catch (err) {
                console.error("Super Admin Check Exception/Timeout:", err);
                isSuperAdmin = false; // Fallback to avoid blank screen
            }



            // 1. Try 'business_users' (Admin/Owners) with TIMEOUT
            console.log("Step 2: Checking business_users...");
            let profile = null;
            try {
                const checkBusinessPromise = supabase
                    .from('business_users')
                    .select('*')
                    .eq('email', authUser.email)
                    .order('created_at', { ascending: false }) // Prioritize recent business
                    .limit(1)
                    .maybeSingle();

                const businessTimeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Business User Check Timed Out')), 5000)
                );

                const { data: businessData, error: businessError } = await Promise.race([
                    checkBusinessPromise,
                    businessTimeoutPromise
                ]);

                if (businessError) console.error("Error fetching business_user:", businessError);
                if (businessData) {
                    profile = businessData;
                    console.log("Found business profile:", profile);
                } else {
                    console.log("No business profile found.");
                }
            } catch (err) {
                console.error("Business User Check Exception/Timeout:", err);
            }

            if (profile) {
                // 1. Fetch Subscription
                console.log("Step 3: Fetching Subscription...");
                // Note: Subscription check is less critical, can fail gracefully if needed
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
                let employee = null;
                try {
                    const checkEmployeePromise = supabase
                        .from('employees')
                        .select('*')
                        .or(`user_id.eq.${authUser.id},email.eq.${authUser.email}`)
                        .maybeSingle();

                    const employeeTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Employee Check Timed Out')), 5000)
                    );

                    const { data: empData, error: empError } = await Promise.race([
                        checkEmployeePromise,
                        employeeTimeoutPromise
                    ]);

                    if (empError) console.error("Error fetching employee:", empError);
                    if (empData) employee = empData;

                } catch (err) {
                    console.error("Employee Check Exception/Timeout:", err);
                }

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
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                console.log('Profile fetch aborted');
                return;
            }
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
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                return false;
            }
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

                while (!isUnique && suffix < 100) { // Limit retry to avoid infinite loops
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
                    user_id: authData.user.id, // Linked to Auth User
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
                // Ensure profile is loaded before redirecting
                await refreshProfile();
                toast.success('¡Cuenta creada correctamente!');
                return { success: true, autoLogin: true };
            } else {
                toast.success('¡Registro exitoso! Por favor verifica tu email.');
                return { success: true, autoLogin: false };
            }
        } catch (error) {
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                return { success: false };
            }
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
        refreshProfile, // Expose this
        // Expose supabase client directly if needed, or helper
        api: null // We are removing `api` axios instance. Components should use `supabase` import.
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
