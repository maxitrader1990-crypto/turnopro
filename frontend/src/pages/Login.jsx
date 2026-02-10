import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import background from '../assets/login-bg.jpeg';

const Login = () => {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(formData.email, formData.password);
        if (success) {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex relative">
            {/* Form Section - Overlay on mobile, Left side on desktop */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between px-8 sm:px-12 lg:px-24 bg-black/85 lg:bg-black relative z-10 py-10 backdrop-blur-sm lg:backdrop-blur-none min-h-screen">
                <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-gradient-to-br from-urban-accent to-yellow-600 rounded-lg flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-yellow-500/20">
                            M
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">Maestros del Estilo</span>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
                            Bienvenido
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Gestiona tu barbería con estilo profesional.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2 ml-1 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-urban-accent focus:border-transparent transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide">Contraseña</label>
                                <a href="#" className="text-xs text-urban-accent hover:text-white transition-colors">¿Olvidaste tu contraseña?</a>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-urban-accent focus:border-transparent transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-urban-accent to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent lg:bg-black text-gray-400 font-medium">O continúa con</span>
                        </div>
                    </div>

                    <button
                        onClick={() => loginWithGoogle()}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-100 font-bold transition-all hover:scale-[1.02]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    <p className="mt-8 text-center text-gray-500">
                        ¿Aún no tienes cuenta?{' '}
                        <Link to="/onboarding" className="font-bold text-urban-accent hover:text-white transition-colors">
                            Crea tu cuenta gratis
                        </Link>
                    </p>
                </div>

                {/* Footer placeholder */}
                <div className="hidden sm:block"></div>
            </div>

            {/* Image Section - Background on mobile, Right side on desktop */}
            <div className="absolute inset-0 lg:static lg:block lg:w-1/2 overflow-hidden bg-zinc-900 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10 pointer-events-none"></div>

                <img
                    src={background}
                    alt="Barber Shop"
                    className="w-full h-full object-cover opacity-80"
                    loading="eager"
                />

                {/* Quote only visible on large screens or if space permits? visible on mobile might cover form, keep it but check z-index */}
                <div className="hidden lg:block absolute bottom-10 right-10 z-20 text-right max-w-md pointer-events-none">
                    <p className="text-white text-3xl font-bold italic drop-shadow-lg">
                        "El estilo es una forma de decir quién eres sin tener que hablar."
                    </p>
                    <p className="text-urban-accent mt-2 font-semibold drop-shadow-md">— Maestros del Estilo</p>
                </div>
            </div>

            <style>{`
                @keyframes ken-burns {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.1); }
                }
                .animate-ken-burns {
                    animation: ken-burns 20s ease-out infinite alternate;
                }
            `}</style>
        </div>
    );
};

export default Login;
