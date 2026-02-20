import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import SplashScreen from '../components/SplashScreen';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchVersion = useRef(0);
    const [debugLogs, setDebugLogs] = useState([]);

    const addDebugLog = (msg) => {
        setDebugLogs(prev => [...prev.slice(-19), `${new Date().toISOString().split('T')[1]} - ${msg}`]);
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            // Safety Timeout to prevent infinite splash screen
            const timeoutId = setTimeout(() => {
                if (mounted) {
                    console.warn("⚠️ Auth Init timed out. Forcing app load.");
                    setLoading(false);
                    toast.error("El inicio de sesión tardó demasiado. Verifica tu conexión.");
                }
            }, 7000); // 7 seconds max

            try {
                addDebugLog("Auth Init Started");
                // 1. Get Initial Session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    addDebugLog(`Auth Init Error: ${error.message}`);
                    throw error;
                }

                if (session?.user) {
                    addDebugLog(`Found existing session: ${session.user.email}`);
                    // Fetch profile. If this succeeds, it sets 'user'.
                    await fetchBusinessProfile(session.user);
                } else {
                    addDebugLog("No existing session found");
                }
            } catch (err) {
                console.error("Auth Init Error:", err);
                addDebugLog(`Auth Init Exception: ${err.message}`);
            } finally {
                clearTimeout(timeoutId);
                // Only stop loading if mounted
                if (mounted) setLoading(false);
            }
        };

        // Start Init
        initAuth();

        // 2. Listen for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth Event: ${event}`);
            addDebugLog(`Auth Event: ${event}`);

            if (event === 'SIGNED_IN' && session?.user) {
                // Only fetch if we don't have the user yet or it's a different user
                // Actually, always safe to fetch, fetchVersion handles ordering
                await fetchBusinessProfile(session.user);
                if (mounted) setLoading(false); // Ensure loading stops on late login
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                if (mounted) setLoading(false);
            } else if (event === 'INITIAL_SESSION') {
                // Handled by getSession mostly, but good backup
                if (session?.user) {
                    await fetchBusinessProfile(session.user);
                }
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            return await fetchBusinessProfile(session.user);
        }
        return null;
    };

    const fetchBusinessProfile = async (authUser) => {
        // INCREMENT VERSION: Any previous fetch is now "stale"
        const currentVersion = ++fetchVersion.current;

        try {
            // console.log(`⚡ Optimizing Profile Fetch for: ${authUser.email}`);

            // 0. LINK IDENTITY (Critical for Manual Login vs Google Login)
            // Ensures that if the email matches a business owners email, the user_id is updated to the current one.
            try {
                await supabase.rpc('claim_profile_by_email');
            } catch (rpcError) {
                console.warn("Identity Linking RPC failed (might not exist yet):", rpcError.message);
            }

            const startTime = performance.now();

            // PARALLEL EXECUTION: Fire all reliable identification queries at once
            // We use Promise.allSettled to ensure one failure doesn't crash the others
            const [superAdminResult, businessUserResult, employeeResult] = await Promise.allSettled([
                // 1. Super Admin Check
                supabase.from('super_admins').select('user_id').eq('user_id', authUser.id).maybeSingle(),

                // 2. Business User Check (Owner) - Check by ID first (fastest), then Email
                supabase.from('business_users').select('*').eq('user_id', authUser.id).maybeSingle()
                    .then(async ({ data, error }) => {
                        if (!data && !error) {
                            return supabase.from('business_users').select('*').eq('email', authUser.email).order('created_at', { ascending: false }).limit(1).maybeSingle();
                        }
                        return { data, error };
                    }),

                // 3. Employee Check (Barber) - Check by ID first, then Email
                supabase.from('employees').select('*').eq('user_id', authUser.id).maybeSingle()
                    .then(async ({ data, error }) => {
                        if (!data && !error) {
                            return supabase.from('employees').select('*').eq('email', authUser.email).maybeSingle();
                        }
                        return { data, error };
                    })
            ]);

            const endTimeHelper = performance.now();
            console.log(`⏱️ Identity checks took ${Math.round(endTimeHelper - startTime)}ms`);

            // CHECK STALENESS BEFORE PROCESSING
            if (currentVersion !== fetchVersion.current) {
                console.log(`⚠️ Discarding stale profile fetch (v${currentVersion} vs v${fetchVersion.current})`);
                return null;
            }

            // --- PROCESS RESULTS ---

            // A. Check Super Admin
            let isSuperAdmin = false;
            if (superAdminResult.status === 'fulfilled' && superAdminResult.value.data) {
                isSuperAdmin = true;
                console.log("✅ User is Super Admin");
            }

            // B. Check Business Owner
            let businessProfile = null;
            if (businessUserResult.status === 'fulfilled' && businessUserResult.value.data) {
                businessProfile = businessUserResult.value.data;
                // Fix missing linkage if found by email
                if (!businessProfile.user_id) {
                    supabase.from('business_users').update({ user_id: authUser.id }).eq('id', businessProfile.id);
                }
            }

            // C. Check Employee
            let employeeProfile = null;
            if (!businessProfile && !isSuperAdmin && employeeResult.status === 'fulfilled' && employeeResult.value.data) {
                employeeProfile = employeeResult.value.data;
                // Fix missing linkage
                if (!employeeProfile.user_id) {
                    supabase.from('employees').update({ user_id: authUser.id }).eq('id', employeeProfile.id);
                }
            }

            // --- FINAL CONSTRUCTION ---

            if (businessProfile) {
                // If Business Owner, we MUST fetch subscription (Critical for App Access)
                // We do this AFTER identifying them to save reads for non-owners
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('business_id', businessProfile.business_id)
                    .maybeSingle();

                let finalSubscription = subscription;

                // FALLBACK: If not found by ID (maybe ID mismatch?), try via email link
                if (!finalSubscription) {
                    console.warn("⚠️ Subscription not found by Business ID. Trying fallback via Email.");
                    const { data: fallbackSub } = await supabase
                        .from('subscriptions')
                        .select('*, businesses!inner(email)')
                        .eq('businesses.email', authUser.email)
                        .maybeSingle();

                    if (fallbackSub) {
                        console.log("✅ Found subscription via Email Fallback");
                        finalSubscription = fallbackSub;
                    }
                    // FALLBACK 2: AUTO-HEALING (If it really doesn't exist, create it)
                    if (!finalSubscription) {
                        console.warn("⚠️ Subscription MISSING. Attempting Auto-Repair (Create new Trial).");
                        // Create a fresh 15-day trial
                        const { data: newSub, error: createError } = await supabase
                            .from('subscriptions')
                            .insert({
                                business_id: businessProfile.business_id,
                                status: 'trial',
                                plan_type: 'pro',
                                trial_start_date: new Date(),
                                trial_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                                current_period_start: new Date(),
                                current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                            })
                            .select()
                            .single();

                        if (newSub) {
                            console.log("✅ Auto-Repair Successful");
                            finalSubscription = newSub;
                            toast.success("Sistema autoreparado: Suscripción activada", { icon: '🔧' });
                        }
                    }
                } // End if (!finalSubscription)

                // --- STATUS CALCULATION ---
                let subStatus = 'inactive';
                let daysRemaining = 0;

                if (finalSubscription) {
                    const now = new Date();
                    const end = new Date(finalSubscription.current_period_end || finalSubscription.trial_end_date);
                    const diffTime = end - now;
                    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                    if (finalSubscription.status === 'active' && daysRemaining > 0) subStatus = 'active';
                    else if (finalSubscription.status === 'trial' && daysRemaining > 0) subStatus = 'trial';
                    else if (daysRemaining <= 0) { subStatus = 'expired'; }
                } else {
                    subStatus = 'expired';
                }

                if (currentVersion !== fetchVersion.current) return null;

                const newUser = {
                    ...authUser,
                    ...businessProfile,
                    role: 'admin',
                    isSuperAdmin,
                    subscription: {
                        ...subscription,
                        status: subStatus,
                        daysRemaining
                    }
                };
                setUser(newUser);
                return newUser;

            } else if (employeeProfile) {
                if (currentVersion !== fetchVersion.current) return null;
                const newUser = {
                    ...authUser,
                    business_id: employeeProfile.business_id,
                    role: 'barber',
                    employee_id: employeeProfile.id,
                    name: employeeProfile.first_name
                };
                setUser(newUser);
                return newUser;

            } else {
                if (currentVersion !== fetchVersion.current) return null;
                const newUser = {
                    ...authUser,
                    isSuperAdmin,
                    role: isSuperAdmin ? 'superadmin' : 'user'
                };
                setUser(newUser);
                return newUser;
            }

            console.log("✅ Profile Load Complete");

        } catch (error) {
            // CHECK STALENESS
            if (currentVersion !== fetchVersion.current) return null;

            console.error('🔥 Error fetching profile', error);
            // Fallback to allow basic login so they aren't stuck on splash
            const fallbackUser = { ...authUser };
            setUser(fallbackUser);
            return fallbackUser;
        }
    };

    const login = async (email, password) => {
        try {
            console.log("🚀 Attempting Robust Login...");

            // GLOBAL SAFETY TIMEOUT: If nothing happens in 10s, kill it.
            const globalTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('GLOBAL_LOGIN_TIMEOUT')), 10000)
            );

            const loginLogic = async () => {
                // STRATEGY 1: Supabase Client (Protected by 4s Timeout)
                const clientPromise = supabase.auth.signInWithPassword({ email, password });
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT_AUTH_CLIENT')), 4000)
                );

                let sessionData = null;

                try {
                    const { data, error } = await Promise.race([clientPromise, timeoutPromise]);
                    if (error) throw error;
                    sessionData = data;
                } catch (err) {
                    if (err.message === 'TIMEOUT_AUTH_CLIENT') {
                        console.warn("⚠️ Auth Client Timeout. Switching to REST Fallback.");
                    } else if (err.message.includes("Invalid login") || err.status === 400) {
                        // If it's a real auth error (wrong password), DO NOT fallback. Throw it.
                        throw err;
                    } else {
                        console.warn("⚠️ Auth Client Error (Network?). Switching to REST Fallback.", err.message);
                    }
                }

                // STRATEGY 2: REST Fallback (If Client failed/timed out AND we don't have a session)
                if (!sessionData?.session) {
                    console.log("🔄 Attempting REST Fallback Login...");
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                    // Fetch with AbortController for strict timeout
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 5000); // 5s max for REST

                    try {
                        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                            method: 'POST',
                            headers: {
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email, password }),
                            signal: controller.signal
                        });
                        clearTimeout(id);

                        if (!response.ok) {
                            const errJson = await response.json();
                            throw new Error(errJson.msg || errJson.error_description || 'Error de autenticación (REST)');
                        }

                        const restData = await response.json();

                        // Manually set session in Supabase Client
                        const { error: setSessionError } = await supabase.auth.setSession({
                            access_token: restData.access_token,
                            refresh_token: restData.refresh_token
                        });

                        if (setSessionError) throw setSessionError;
                        sessionData = { session: restData, user: restData.user };

                    } catch (fetchError) {
                        clearTimeout(id);
                        if (fetchError.name === 'AbortError') {
                            throw new Error("El servidor tardó demasiado en responder (REST Timeout).");
                        }
                        throw fetchError;
                    }
                }

                return true;
            };

            // Race the logic against the global timeout
            await Promise.race([loginLogic(), globalTimeout]);

            toast.success('¡Bienvenido!');
            return true;
        } catch (error) {
            console.error("🔥 Login Error:", error);
            let msg = error.message || 'Error al iniciar sesión';

            if (msg === 'GLOBAL_LOGIN_TIMEOUT') {
                msg = "El inicio de sesión tardó demasiado. Por favor, revisa tu conexión.";
            } else if (msg.includes('Timeout')) {
                msg = "Tiempo de espera agotado. Intenta de nuevo.";
            }

            toast.error(msg);
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

                // 4. Seed Default Data (Services & Rewards & Employees)

                // Services
                const defaultServices = [
                    { name: 'Corte Premium', price: 16000, duration_minutes: 45, points_reward: 20, description: 'Corte de cabello profesional con lavado y styling.', category: 'Cabello' },
                    { name: 'Corte + Barba VIP', price: 20000, duration_minutes: 60, points_reward: 35, description: 'Servicio completo: Corte, perfilado de barba y toalla caliente.', category: 'Completo' },
                    { name: 'Perfilado de Cejas', price: 5000, duration_minutes: 15, points_reward: 10, description: 'Diseño y limpieza de cejas con navaja o cera.', category: 'Rostro' },
                    { name: 'Diseños / Freestyle', price: 4000, duration_minutes: 15, points_reward: 10, description: 'Diseño artístico a elección.', category: 'Arte' }
                ];

                await supabase.from('services').insert(
                    defaultServices.map(s => ({ ...s, business_id: business.id }))
                );

                // Rewards
                const defaultRewards = [
                    { name: 'Corte Gratis', points_cost: 1000, description: 'Canjea 1000 puntos por un corte totalmente gratis.' },
                    { name: '50% OFF en Corte + Barba', points_cost: 600, description: 'Mitad de precio en tu servicio completo.' },
                    { name: 'Producto de Styling', points_cost: 400, description: 'Cera, gel o pomada a elección.' },
                    { name: 'Bebida Premium', points_cost: 100, description: 'Café especial o bebida energética durante tu espera.' }
                ];

                await supabase.from('rewards').insert(
                    defaultRewards.map(r => ({ ...r, business_id: business.id }))
                );

                // Employees (4 Default Staff)
                // Employees (4 Default Staff)
                const defaultEmployees = [
                    {
                        first_name: 'Barbero',
                        last_name: 'Principal',
                        role: 'admin',
                        email: email,
                        phone: '',
                        bio: 'Fundador y Maestro Barbero. Especialista en cortes clásicos y afeitado tradicional con toalla caliente.',
                        profile_image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        user_id: authData.user.id
                    },
                    {
                        first_name: 'Estilista',
                        last_name: 'Senior',
                        role: 'barber',
                        email: 'staff1@demo.com',
                        phone: '',
                        bio: 'Visionaria del color y las nuevas tendencias. Transformo tu look con las técnicas más modernas.',
                        profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        user_id: null
                    },
                    {
                        first_name: 'Especialista',
                        last_name: 'Barba',
                        role: 'barber',
                        email: 'staff2@demo.com',
                        phone: '',
                        bio: 'El arquitecto de la barba. Perfilado perfecto y cuidado de la piel para el caballero moderno.',
                        profile_image_url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        user_id: null
                    },
                    {
                        first_name: 'Barbero',
                        last_name: 'Junior',
                        role: 'barber',
                        email: 'staff3@demo.com',
                        phone: '',
                        bio: 'Talento joven con pasión por el detalle. Especialista en degradados y diseños urbanos.',
                        profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        user_id: null
                    }
                ];

                const { data: createdEmployees } = await supabase.from('employees').insert(
                    defaultEmployees.map(e => ({ ...e, business_id: business.id }))
                ).select();

                // 6. Seed Portfolio Items (For Carousel & Individual Portfolios)
                const defaultPortfolioImages = [
                    "https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1585747860715-28b9634317a2?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1532710093739-9470acff878f?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop"
                ];

                const portfolioInserts = [];
                // Distribute images among employees
                if (createdEmployees && createdEmployees.length > 0) {
                    defaultPortfolioImages.forEach((img, index) => {
                        // Round robin assignment
                        const employee = createdEmployees[index % createdEmployees.length];
                        portfolioInserts.push({
                            business_id: business.id,
                            employee_id: employee.id,
                            image_url: img,
                            description: "Trabajo Premium - Estilo y Corte"
                        });
                    });

                    await supabase.from('portfolio_items').insert(portfolioInserts);
                }

                // 5. Create Free Trial Subscription (Handled by DB Trigger now)
                // The trigger 'on_business_created_add_subscription' will automatically add the subscription.

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

    const loginWithGoogle = async () => {
        console.log("Initiating Google Login...");
        const toastId = toast.loading('Abriendo Google...');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            toast.error(error.message || 'Error con Google');
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
        loginWithGoogle,
        logout,
        register,
        refreshProfile, // Expose this
        debugLogs,      // Expose debug logs
        // Expose supabase client directly if needed, or helper
        api: null // We are removing `api` axios instance. Components should use `supabase` import.
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <SplashScreen /> : children}
        </AuthContext.Provider>
    );
};
