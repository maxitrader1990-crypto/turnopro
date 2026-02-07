import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BarberPortfolio = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Fetch Employee Profile
    const { data: employee } = useQuery({
        queryKey: ['myEmployeeProfile', user?.id],
        queryFn: async () => {
            const { data } = await supabase.from('employees').select('id').eq('user_id', user.id).single();
            return data;
        },
        enabled: !!user?.id
    });

    // Fetch Portfolio Items
    const { data: portfolioItems, isLoading } = useQuery({
        queryKey: ['myPortfolio', employee?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('employee_id', employee.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!employee?.id
    });

    // Upload Handler
    const handleUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${employee.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('portfolios')
                .upload(filePath, file);

            if (uploadError) {
                // If bucket doesn't exist, try to use 'images' bucket or alert user
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('El bucket "portfolios" no existe. Contacta al admin.');
                }
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolios')
                .getPublicUrl(filePath);

            // 3. Insert into DB
            await supabase.from('portfolio_items').insert({
                employee_id: employee.id,
                image_url: publicUrl,
                description: 'Mi trabajo' // Can contain logic to ask user
            });

            toast.success('Imagen subida con éxito');
            queryClient.invalidateQueries(['myPortfolio']);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    // Delete Handler
    const removeMutation = useMutation({
        mutationFn: async (id) => {
            await supabase.from('portfolio_items').delete().eq('id', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myPortfolio']);
            toast.success('Imagen eliminada');
        }
    });

    if (!employee) return <div className="text-white">Cargando perfil...</div>;

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                        <ImageIcon className="text-urban-accent" /> Mi Portafolio
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Sube tus mejores cortes para que los clientes los vean.</p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                    />
                    <button className="btn-urban flex items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                        {uploading ? 'Subiendo...' : 'Subir Foto'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <p className="text-gray-500 col-span-full text-center">Cargando fotos...</p>
                ) : portfolioItems?.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-dashed border-2 border-white/10 rounded-xl">
                        <p className="text-gray-500">Aún no has subido fotos.</p>
                    </div>
                ) : (
                    portfolioItems?.map((item) => (
                        <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                            <img src={item.image_url} alt="Work" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Borrar esta foto?')) removeMutation.mutate(item.id);
                                    }}
                                    className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BarberPortfolio;
