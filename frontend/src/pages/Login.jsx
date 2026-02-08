import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(formData.email, formData.password);
        if (success) {
            // Role-based redirect is handled inside login() or here if we had the user object immediately.
            // Since login() updates state asynchronously, we might need to check user role or rely on AuthContext. 
            // Better: Let's assume standard redirect and let ProtectedRoute handle it OR fetch user here.

            // However, login() in AuthContext returns true/false.
            // Let's modify redirection to check role if possible, or default to root which ProtectedRoute handles.
            // But ProtectedRoute for /dashboard redirects to /onboarding if no business.
            // So we must redirect to /superadmin explicitly if needed.

            // We don't have the user object here easily without race conditions.
            // BUT, we can simply redirect to '/' and let the router decide?
            // ProtectedRoute for '/' redirects to '/dashboard'.

            // Let's hard reload or simple redirect.
            // Ideally, we should check the user role.
            // We can get the user from supabase directly to be sure.
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-premium-bg z-0"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-urban-secondary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-urban-accent/10 rounded-full blur-[100px] animate-pulse-slow delay-100"></div>

            <div className="max-w-md w-full card-premium p-8 relative z-10 animate-fade-in-up border-white/10">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">Bienvenido</h2>
                    <p className="text-gray-400 mt-2 text-lg">Inicia sesión en tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full input-urban"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full input-urban"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-urban flex justify-center items-center mt-4"
                    >
                        Iniciar Sesión con Email
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-premium-surface/50 backdrop-blur-sm text-gray-400 rounded-full">O continúa con</span>
                    </div>
                </div>

                <button
                    onClick={() => loginWithGoogle()}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all hover:scale-[1.02] shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </button>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <Link to="/onboarding" className="font-medium text-urban-accent hover:text-urban-accent/80 transition-colors uppercase tracking-wide text-xs">
                            Regístrate gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
