import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';

const OnboardingPage = () => {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { register: registerAuth, user, loginWithGoogle, refreshProfile } = useAuth(); // Destructure properly

    // Pre-fill if user logged in via Google
    useEffect(() => {
        if (user?.email) {
            setValue('email', user.email);
            // Try to extract name from metadata if available
            const meta = user.user_metadata;
            if (meta) {
                if (meta.full_name) {
                    const parts = meta.full_name.split(' ');
                    setValue('firstName', parts[0]);
                    setValue('lastName', parts.slice(1).join(' '));
                } else if (meta.name) {
                    setValue('firstName', meta.name);
                }
            }
        }
    }, [user, setValue]);

    const registerMutation = useMutation({
        mutationFn: async (data) => {
            // Case A: User already logged in (Google) -> Create Business & Link
            if (user) {
                // Generate slug if invalid
                let finalSlug = data.slug;
                if (!finalSlug) {
                    finalSlug = data.businessName
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                }

                // Ensure Uniqueness (Simple check loop)
                let isUnique = false;
                let suffix = 0;
                let checkSlug = finalSlug;

                while (!isUnique && suffix < 100) {
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

                if (!isUnique) throw new Error("Could not generate a unique business URL.");

                // 1. Create Business
                const { data: bus, error: bErr } = await supabase
                    .from('businesses')
                    .insert({
                        name: data.businessName,
                        subdomain: finalSlug,
                        email: user.email,
                        gamification_enabled: true
                    })
                    .select('id')
                    .single();

                if (bErr) throw bErr;

                // FIX: Ensure we have the correct User ID from the session (sometimes context is stale)
                const { data: sessionData } = await supabase.auth.getSession();
                const sessionUser = sessionData?.session?.user || user;

                if (!sessionUser?.id) throw new Error("User ID missing. Please refresh and try again.");

                // 2. Link User in business_users
                const { error: uErr } = await supabase
                    .from('business_users')
                    .insert({
                        business_id: bus.id,
                        email: sessionUser.email,
                        first_name: data.firstName,
                        last_name: data.lastName,
                        role: 'owner',
                        user_id: sessionUser.id,
                        full_name: `${data.firstName} ${data.lastName}`.trim()
                    });

                if (uErr) throw uErr;

                // IMPORTANT: Manually refresh profile to update context WITHOUT reload
                await refreshProfile();

                return true;
            }

            // Case B: Fresh Registration (Email/Pass)
            else {
                // We pass businessName, slug, firstName, AND lastName now
                const result = await registerAuth(data.email, data.password, data.businessName, data.slug, data.firstName, data.lastName);
                if (!result.success) throw new Error("Registration failed");
                return result;
            }
        },
        onSuccess: (result) => {
            // If result is boolean true (from Google flow or autoLogin) OR object with autoLogin: true
            if (result === true || result?.autoLogin) {
                toast.success("¡Bienvenido al Dashboard!");
                // Use navigate instead of window.location.href to preserve session state
                navigate('/dashboard', { replace: true });
            } else {
                toast.success("Revisa tu email para confirmar.");
                setTimeout(() => navigate('/login'), 2000);
            }
        },
        onError: (err) => {
            console.error(err);
            toast.error("Error: " + err.message);
        }
    });

    const onSubmit = (data) => {
        registerMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {user ? 'Completa tu Perfil de Negocio' : 'Comienza tu prueba gratis'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {user ? `Hola ${user.email}, configura tu espacio.` : 'Pon tu negocio online en minutos.'}
                </p>
                {!user && (
                    <div className="mt-4">
                        <button
                            onClick={() => loginWithGoogle()}
                            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Registrarse con Google
                        </button>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 text-gray-500">O con email</span></div>
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={async () => {
                                    toast.loading("Buscando tu negocio...", { id: 'refreshing' });
                                    await refreshProfile();

                                    // Check status after refresh
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (user?.business_id || session?.user?.user_metadata?.business_id) {
                                        toast.success("¡Negocio encontrado!", { id: 'refreshing' });
                                        navigate('/dashboard', { replace: true });
                                    } else {
                                        toast.error("No se detectó ningún negocio. Por favor crea uno.", { id: 'refreshing' });
                                    }
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                                ¿Ya tienes un negocio? Recargar perfil
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                            <input {...register('businessName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">URL Personalizada</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    maestrosdelestilo.com/p/
                                </span>
                                <input {...register('slug', { required: false })} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 p-2" placeholder="slug-automatico" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tu Nombre</label>
                                <input {...register('firstName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tu Apellido</label>
                                <input {...register('lastName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>

                        {!user && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" {...register('email', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                                    <input type="password" {...register('password', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                            </>
                        )}
                        {user && (
                            <input type="hidden" {...register('email')} />
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono (Opcional)</label>
                            <input type="tel" {...register('phone')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                {user ? 'Crear Negocio' : 'Crear Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="mt-8 text-center text-xs text-gray-500">
                Desarrollado por <span className="font-semibold text-gray-700">Patagonia Automatiza</span>
            </div>
        </div >
    );
};

export default OnboardingPage;
