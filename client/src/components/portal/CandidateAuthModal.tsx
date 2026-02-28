import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useCandidateAuth } from '../../context/CandidateAuthContext';

interface CandidateAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

const CandidateAuthModal: React.FC<CandidateAuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useCandidateAuth();

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [registerData, setRegisterData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        ciudad: '',
        titulo_profesional: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(loginData.email, loginData.password);
            onClose();
        } catch (err: any) {
            console.error('Login error:', err);

            // Mensajes de error más específicos
            let errorMessage = 'Error al iniciar sesión';

            if (err.response) {
                const status = err.response.status;
                const serverMessage = err.response.data?.error;

                if (status === 401) {
                    errorMessage = serverMessage || 'Email o contraseña incorrectos';
                } else if (status === 404) {
                    errorMessage = 'No existe una cuenta con este email';
                } else if (status === 500) {
                    errorMessage = 'Error del servidor. Por favor intenta más tarde';
                } else if (serverMessage) {
                    errorMessage = serverMessage;
                }
            } else if (err.request) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión';
            } else {
                errorMessage = err.message || 'Error desconocido';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(registerData);
            onClose();
        } catch (err: any) {
            console.error('Register error:', err);

            // Mensajes de error más específicos
            let errorMessage = 'Error al registrarse';

            if (err.response) {
                const status = err.response.status;
                const serverMessage = err.response.data?.error;

                if (status === 400) {
                    errorMessage = serverMessage || 'Datos inválidos. Verifica la información';
                } else if (status === 409) {
                    errorMessage = 'Ya existe una cuenta con este email';
                } else if (status === 500) {
                    errorMessage = 'Error del servidor. Por favor intenta más tarde';
                } else if (serverMessage) {
                    errorMessage = serverMessage;
                }
            } else if (err.request) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión';
            } else {
                errorMessage = err.message || 'Error desconocido';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative overflow-hidden">
                {/* Header Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-900 to-blue-800 z-0"></div>

                {/* Header */}
                <div className="relative z-10 px-8 pt-8 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {mode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
                            </h2>
                            <p className="text-blue-100/80 text-sm mt-1">
                                {mode === 'login'
                                    ? 'Inicia sesión para postularte'
                                    : 'Únete a nuestra red de talentos'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-4 bg-white rounded-t-3xl -mt-6 relative z-20">
                    {error && (
                        <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
                            <span className="mt-0.5 block w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                            {error}
                        </div>
                    )}

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Correo Electrónico
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Contraseña
                                    </label>
                                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">¿Olvidaste tu contraseña?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder-slate-400"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Nombre Completo
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={registerData.nombre}
                                        onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                            </div>

                            {/* Email y Teléfono */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={registerData.telefono}
                                        onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="+57 300..."
                                    />
                                </div>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Título Profesional
                                </label>
                                <input
                                    type="text"
                                    value={registerData.titulo_profesional}
                                    onChange={(e) => setRegisterData({ ...registerData, titulo_profesional: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                    placeholder="Ej: Ingeniero de Sistemas"
                                />
                            </div>

                            {/* Ciudad */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    value={registerData.ciudad}
                                    onChange={(e) => setRegisterData({ ...registerData, ciudad: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                    placeholder="Bogotá, Colombia"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                        className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.98]"
                            >
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                            </button>
                        </form>
                    )}

                    {/* Toggle Mode */}
                    <div className="text-center pt-6 mt-2 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes cuenta?'}
                            {' '}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'register' : 'login');
                                    setError('');
                                }}
                                className="text-blue-700 hover:text-blue-800 font-bold hover:underline"
                            >
                                {mode === 'login' ? 'Regístrate Gratis' : 'Inicia Sesión'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateAuthModal;
