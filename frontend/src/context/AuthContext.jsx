import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import SplashScreen from '../components/SplashScreen';

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
        }, 8000); // 8 seconds safety timeout

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
            console.log("⚡ Optimizing Profile Fetch for:", authUser.email);
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

                let subStatus = 'inactive';
                let daysRemaining = 0;

                if (subscription) {
                    const now = new Date();
                    const end = new Date(subscription.current_period_end || subscription.trial_end_date);
                    const diffTime = end - now;
                    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                    if (subscription.status === 'active' && daysRemaining > 0) subStatus = 'active';
                    else if (subscription.status === 'trial' && daysRemaining > 0) subStatus = 'trial';
                    else if (daysRemaining <= 0) subStatus = 'expired';
                } else {
                    // Fallback for no subscription record (shouldn't happen with new trigger)
                    subStatus = 'expired';
                }

                setUser({
                    ...authUser,
                    ...businessProfile,
                    role: 'admin',
                    isSuperAdmin,
                    subscription: {
                        ...subscription,
                        status: subStatus,
                        daysRemaining
                    }
                });

            } else if (employeeProfile) {
                // Is Employee
                setUser({
                    ...authUser,
                    business_id: employeeProfile.business_id,
                    role: 'barber',
                    employee_id: employeeProfile.id,
                    name: employeeProfile.first_name
                });

            } else {
                // Fallback / Just Authenticated but no profile
                // (Could be Super Admin without business profile, or new user stuck)
                setUser({
                    ...authUser,
                    isSuperAdmin,
                    role: isSuperAdmin ? 'superadmin' : 'user' // Basic fallback
                });
            }

            console.log(`✅ Profile Load Complete in ${Math.round(performance.now() - startTime)}ms`);

        } catch (error) {
            console.error('🔥 Error fetching profile', error);
            // Fallback to allow basic login so they aren't stuck on splash
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
        // Expose supabase client directly if needed, or helper
        api: null // We are removing `api` axios instance. Components should use `supabase` import.
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <SplashScreen /> : children}
        </AuthContext.Provider>
    );
};
