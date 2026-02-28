import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/register', {
                fullName,
                email,
                password
            });

            if (res.data.success) {
                // Success - redirect to login
                navigate('/login', { state: { message: 'Cuenta creada exitosamente. Por favor inicia sesión.' } });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Branding (Same as Login for consistency) */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-[#0d1117] relative overflow-hidden p-12">
                <div className="absolute inset-0 bg-purple-600/10 z-0"></div>
                <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]"></div>

                <div className="relative z-10 max-w-lg text-center">
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                        Únete a  <span className="text-blue-400">DISCOL</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-light leading-relaxed">
                        Crea tu perfil profesional, recibe ofertas personalizadas y gestiona tus postulaciones en un solo lugar.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-4 text-left">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <User className="text-blue-400 mb-2" />
                            <h3 className="text-white font-bold">Perfil Único</h3>
                            <p className="text-xs text-gray-500">Gestiona tu CV y experiencia</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <CheckCircle className="text-green-400 mb-2" />
                            <h3 className="text-white font-bold">Postulación Rápida</h3>
                            <p className="text-xs text-gray-500">Aplica con un solo clic</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center items-center bg-[#0a0c10] p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Crear Cuenta</h2>
                        <p className="mt-2 text-gray-400">Comienza tu viaje profesional hoy</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nombre Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-[#161b22] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Juan Pérez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-[#161b22] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="juan@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 bg-[#161b22] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirmar</label>
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-3 bg-[#161b22] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#0a0c10] transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Crear Cuenta
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
