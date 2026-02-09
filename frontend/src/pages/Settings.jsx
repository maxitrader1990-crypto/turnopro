import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Settings as SettingsIcon, Store, Link as LinkIcon, Copy, Save, Loader, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('guide');
    const queryClient = useQueryClient();

    // 1. Fetch Business Data
    const { data: business, isLoading } = useQuery({
        queryKey: ['businessProfile', user?.business_id],
        queryFn: async () => {
            if (!user?.business_id) return null;
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', user.business_id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id
    });

    // Form setup
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

    // Set form values when data loads
    useEffect(() => {
        if (business) {
            setValue('name', business.name);
            setValue('phone', business.phone);
            setValue('subdomain', business.subdomain);
        }
    }, [business, setValue]);

    // 2. Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (formData) => {
            const { error } = await supabase
                .from('businesses')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    // subdomain: formData.subdomain // careful with changing this as it breaks links
                })
                .eq('id', user.business_id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['businessProfile']);
            toast.success('¡Perfil de negocio actualizado!');
        },
        onError: (e) => toast.error('Error: ' + e.message)
    });

    const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        toast.success('Enlace copiado');
    };

    const businessLink = business?.subdomain
        ? `${window.location.origin}/book/${business.subdomain}`
        : `${window.location.origin}/book/${user?.business_id}`;

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight">Configuración y Ayuda</h1>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`pb-4 px-2 flex items-center gap-2 font-medium transition-all text-sm uppercase tracking-wide border-b-2 ${activeTab === 'guide'
                        ? 'border-urban-accent text-urban-accent'
                        : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                >
                    <BookOpen size={18} />
                    Guía de Inicio
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 flex items-center gap-2 font-medium transition-all text-sm uppercase tracking-wide border-b-2 ${activeTab === 'general'
                        ? 'border-urban-accent text-urban-accent'
                        : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                >
                    <SettingsIcon size={18} />
                    Perfil del Negocio
                </button>
                <button
                    onClick={() => navigate('/settings/billing')}
                    className={`pb-4 px-2 flex items-center gap-2 font-medium transition-all text-sm uppercase tracking-wide border-b-2 border-transparent text-gray-500 hover:text-white hover:border-gray-700`}
                >
                    <CreditCard size={18} />
                    Suscripción
                </button>
            </div>

            {/* Content */}
            <div className="card-premium p-8">

                {/* GUIDE TAB */}
                {activeTab === 'guide' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="prose max-w-none text-gray-300">
                            <h2 className="text-2xl font-bold text-white mb-6">Bienvenido a TurnoPro</h2>
                            <p className="mb-6 text-gray-400">
                                Sigue estos pasos para poner en marcha tu negocio rápidamente y ofrecer una experiencia premium.
                            </p>

                            {/* Step 1: Services */}
                            <div className="flex gap-5 mb-8 group">
                                <div className="w-12 h-12 rounded-2xl bg-urban-accent/10 text-urban-accent flex items-center justify-center font-bold text-xl shrink-0 border border-urban-accent/20 group-hover:bg-urban-accent group-hover:text-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]">1</div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Crea tus Servicios</h3>
                                    <p className="mb-2 text-gray-400 text-sm">Define tu menú de servicios.</p>
                                    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-gray-500">
                                        <li>Ve a la pestaña <strong>Servicios</strong>.</li>
                                        <li>Crea servicios con precio y duración.</li>
                                        <li>Marca como "Destacado" o "Barba" para más puntos.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 2: Employees */}
                            <div className="flex gap-5 mb-8 group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl shrink-0 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">2</div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Registra tu Equipo</h3>
                                    <p className="mb-2 text-gray-400 text-sm">¿Quiénes cortan el pelo?</p>
                                    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-gray-500">
                                        <li>Ve a la pestaña <strong>Empleados</strong>.</li>
                                        <li>Crea perfiles con fotos reales (muy importante para la UI).</li>
                                        <li>Asigna sus turnos.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 3: Link */}
                            <div className="flex gap-5 mb-8 group">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center font-bold text-xl shrink-0 border border-green-500/20 group-hover:bg-green-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]">3</div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">¡Lanza tu Sitio!</h3>
                                    <p className="mb-2 text-gray-400 text-sm">Comparte tu enlace exclusivo.</p>
                                    <div className="bg-black/30 p-4 rounded-xl flex items-center justify-between border border-white/10 mt-3 group-hover:border-green-500/50 transition-colors">
                                        <div className="flex items-center gap-3 text-green-400 font-medium truncate">
                                            <Store size={18} />
                                            <span className="truncate text-xs sm:text-sm font-mono">{businessLink}</span>
                                        </div>
                                        <button
                                            onClick={() => copyLink(businessLink)}
                                            className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all"
                                        >
                                            <Copy size={14} />
                                            Copiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'general' && (
                    <div className="animate-in fade-in duration-300 max-w-2xl">
                        {isLoading ? (
                            <div className="text-center py-10"><Loader className="animate-spin mx-auto text-urban-accent" /></div>
                        ) : (
                            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Información Pública del Negocio</h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del Negocio</label>
                                            <input
                                                {...register('name', { required: "El nombre es obligatorio" })}
                                                type="text"
                                                className="input-urban w-full"
                                                placeholder="Ej. Barbería King"
                                            />
                                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                                            <p className="text-xs text-gray-500 mt-2">Este nombre aparecerá en la portada de tu página de reservas.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                                            <input
                                                {...register('phone')}
                                                type="text"
                                                className="input-urban w-full"
                                                placeholder="Ej. 5492804..."
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Número para que tus clientes te contacten.</p>
                                        </div>

                                        <div className="opacity-50 pointer-events-none grayscale">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subdominio (Enlace)</label>
                                            <input
                                                {...register('subdomain')}
                                                type="text"
                                                className="input-urban w-full bg-black/40 border-dashed"
                                                readOnly
                                            />
                                            <p className="text-xs text-yellow-600 mt-2">⚠ Contacta a soporte para cambiar tu enlace permanente.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Detalles de Cuenta</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email del Propietario</label>
                                        <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-400">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="btn-urban flex items-center gap-2 px-8 py-3 text-base"
                                    >
                                        {updateMutation.isPending ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
