import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api';
import { Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data.success) {
                login(res.data.token, res.data.user, res.data.tenant);
                // All admin roles go to dashboard
                navigate('/dashboard');
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-[#0d1117] relative overflow-hidden p-12">
                <div className="absolute inset-0 bg-blue-600/10 z-0"></div>
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[80px]"></div>

                <div className="relative z-10 max-w-lg text-center">
                    <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/10 shadow-xl shadow-blue-500/10">
                        <img src="/logo_discol.jpg" alt="Logo DISCOL" className="w-20 h-20 object-contain rounded-xl" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                        GH-SCORE <span className="text-blue-400 font-light">PRO</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-light leading-relaxed mb-10">
                        Panel de Gestión de Talento Humano — DISCOL S.A.S.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all">
                            <span className="text-2xl mb-2 block">📋</span>
                            <h3 className="text-white font-bold text-sm">Vacantes</h3>
                            <p className="text-xs text-gray-500 mt-1">Gestión y seguimiento de requisiciones</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all">
                            <span className="text-2xl mb-2 block">👥</span>
                            <h3 className="text-white font-bold text-sm">Candidatos</h3>
                            <p className="text-xs text-gray-500 mt-1">Seguimiento integral de postulantes</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all">
                            <span className="text-2xl mb-2 block">📊</span>
                            <h3 className="text-white font-bold text-sm">Analíticas</h3>
                            <p className="text-xs text-gray-500 mt-1">KPIs y métricas de reclutamiento</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all">
                            <span className="text-2xl mb-2 block">🤖</span>
                            <h3 className="text-white font-bold text-sm">IA Integrada</h3>
                            <p className="text-xs text-gray-500 mt-1">Sourcing y análisis inteligente</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center items-center bg-[#0a0c10] p-8 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Mobile logo */}
                    <div className="flex flex-col items-center lg:hidden mb-8">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                            <img src="/logo_discol.jpg" alt="Logo" className="w-14 h-14 object-contain rounded-xl" />
                        </div>
                        <h1 className="text-2xl font-black text-white">GH-SCORE <span className="text-blue-400 font-light">PRO</span></h1>
                    </div>

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Shield size={14} className="text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Panel Administrativo</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Iniciar Sesión</h2>
                        <p className="mt-2 text-gray-500 text-sm">Acceso exclusivo para el equipo de Gestión Humana</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Correo Electrónico Corporativo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-600" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-[#161b22] border border-white/8 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all duration-200 hover:border-white/15"
                                    placeholder="usuario@discol.com.co"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-600" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-[#161b22] border border-white/8 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all duration-200 hover:border-white/15"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1e4b7a] to-[#3a94cc] hover:from-[#3a94cc] hover:to-[#1e4b7a] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ingresar al Panel</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/5 text-center">
                        <p className="text-gray-600 text-xs">
                            ¿Problemas para ingresar? Contacta al administrador del sistema.
                        </p>
                        <p className="text-gray-700 text-[10px] mt-2 font-mono">
                            GH-SCORE PRO v3.0 · DISCOL S.A.S. · {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
