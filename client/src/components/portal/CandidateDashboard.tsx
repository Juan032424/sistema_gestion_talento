import React, { useState, useEffect } from 'react';
import { useCandidateAuth } from '../../context/CandidateAuthContext';
import api from '../../api';
import {
    User, Briefcase, BookmarkIcon, Bell, FileText, Award,
    Edit, LogOut, CheckCircle, XCircle, Clock, TrendingUp,
    MapPin, Mail, Phone, Calendar, DollarSign
} from 'lucide-react';

/**
 * ===================================
 * 🎯 CANDIDATE DASHBOARD
 * Dashboard principal para candidatos autenticados
 * ===================================
 */

interface Application {
    id: number;
    vacante_id: number;
    puesto_nombre: string;
    codigo_requisicion: string;
    estado: string;
    auto_match_score: number;
    fecha_postulacion: string;
    fecha_ultima_actualizacion: string;
    vacante_estado: string;
}

interface CandidateProfile {
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    titulo_profesional?: string;
    ciudad?: string;
    cv_url?: string;
    profileCompleteness: number;
    skills?: Array<{ habilidad: string; nivel: string }>;
    education?: Array<any>;
    experience?: Array<any>;
}

const CandidateDashboard: React.FC = () => {
    const { user, logout } = useCandidateAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'profile' | 'saved'>('overview');
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [savedJobs, setSavedJobs] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [profileRes, appsRes, savedRes, notifsRes] = await Promise.all([
                api.get('/candidates/profile'),
                api.get('/candidates/applications'),
                api.get('/candidates/saved-jobs'),
                api.get('/candidates/notifications')
            ]);

            setProfile(profileRes.data.profile);
            setApplications(appsRes.data.applications || []);
            setSavedJobs(savedRes.data.savedJobs || []);
            setNotifications(notifsRes.data.notifications || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (estado: string) => {
        const colors: Record<string, string> = {
            'Nueva': 'bg-blue-100 text-blue-800',
            'En Revisión': 'bg-yellow-100 text-yellow-800',
            'Entrevista': 'bg-purple-100 text-purple-800',
            'Finalista': 'bg-green-100 text-green-800',
            'Descartado': 'bg-red-100 text-red-800',
            'Contratado': 'bg-emerald-100 text-emerald-800'
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (estado: string) => {
        const icons: Record<string, JSX.Element> = {
            'Nueva': <Clock className="w-4 h-4" />,
            'En Revisión': <FileText className="w-4 h-4" />,
            'Entrevista': <User className="w-4 h-4" />,
            'Finalista': <Award className="w-4 h-4" />,
            'Descartado': <XCircle className="w-4 h-4" />,
            'Contratado': <CheckCircle className="w-4 h-4" />
        };
        return icons[estado] || <Clock className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-md border-b-4 border-blue-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                {user?.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    ¡Hola, {user?.nombre}!
                                </h1>
                                <p className="text-gray-600">{profile?.titulo_profesional || 'Candidato'}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Postulaciones</p>
                                <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
                            </div>
                            <Briefcase className="w-12 h-12 text-blue-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">En Proceso</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {applications.filter(a => ['En Revisión', 'Entrevista', 'Finalista'].includes(a.estado)).length}
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Guardadas</p>
                                <p className="text-3xl font-bold text-gray-900">{savedJobs.length}</p>
                            </div>
                            <BookmarkIcon className="w-12 h-12 text-purple-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Perfil Completo</p>
                                <p className="text-3xl font-bold text-gray-900">{profile?.profileCompleteness || 0}%</p>
                            </div>
                            <User className="w-12 h-12 text-orange-500 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-8 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                📊 Resumen
                            </button>
                            <button
                                onClick={() => setActiveTab('applications')}
                                className={`px-8 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'applications'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                💼 Mis Postulaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-8 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                👤 Mi Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`px-8 py-4 font-medium text-sm border-b-2 transition ${activeTab === 'saved'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                🔖 Guardadas
                            </button>
                        </nav>
                    </div>

                    <div className="p-8">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Resumen de Actividad</h2>

                                {/* Recent Applications */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimas Postulaciones</h3>
                                    <div className="space-y-3">
                                        {applications.slice(0, 5).map((app) => (
                                            <div
                                                key={app.id}
                                                className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{app.puesto_nombre}</h4>
                                                        <p className="text-sm text-gray-600">{app.codigo_requisicion}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Postulado: {new Date(app.fecha_postulacion).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.estado)}`}>
                                                            {getStatusIcon(app.estado)}
                                                            <span>{app.estado}</span>
                                                        </span>
                                                        <p className="text-sm font-semibold text-blue-600 mt-2">
                                                            Match: {app.auto_match_score}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {applications.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">
                                                No tienes postulaciones aún. ¡Explora las vacantes disponibles!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Applications Tab */}
                        {activeTab === 'applications' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Mis Postulaciones</h2>
                                <div className="grid gap-4">
                                    {applications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{app.puesto_nombre}</h3>
                                                    <p className="text-gray-600">{app.codigo_requisicion}</p>
                                                </div>
                                                <span className={`inline-flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.estado)}`}>
                                                    {getStatusIcon(app.estado)}
                                                    <span>{app.estado}</span>
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Match Score</p>
                                                    <p className="text-lg font-bold text-blue-600">{app.auto_match_score}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Fecha Postulación</p>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(app.fecha_postulacion).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Estado Vacante</p>
                                                    <p className="text-sm text-gray-900">{app.vacante_estado}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && profile && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
                                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                                        <Edit className="w-4 h-4" />
                                        <span>Editar Perfil</span>
                                    </button>
                                </div>

                                {/* Profile Completeness Bar */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Completitud del Perfil</span>
                                        <span className="text-sm font-bold text-blue-600">{profile.profileCompleteness}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${profile.profileCompleteness}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="grid gap-6">
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <User className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Nombre</p>
                                                    <p className="font-medium text-gray-900">{profile.nombre} {profile.apellido}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <p className="font-medium text-gray-900">{profile.email}</p>
                                                </div>
                                            </div>
                                            {profile.telefono && (
                                                <div className="flex items-center space-x-3">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Teléfono</p>
                                                        <p className="font-medium text-gray-900">{profile.telefono}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {profile.ciudad && (
                                                <div className="flex items-center space-x-3">
                                                    <MapPin className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ciudad</p>
                                                        <p className="font-medium text-gray-900">{profile.ciudad}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {profile.skills && profile.skills.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Habilidades</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                                    >
                                                        {skill.habilidad} - {skill.nivel}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Saved Jobs Tab */}
                        {activeTab === 'saved' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Vacantes Guardadas</h2>
                                <div className="grid gap-4">
                                    {savedJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                                        >
                                            <h3 className="text-xl font-bold text-gray-900">{job.puesto_nombre}</h3>
                                            <p className="text-gray-600 mb-2">{job.codigo_requisicion}</p>
                                            {job.notas && (
                                                <p className="text-sm text-gray-700 italic">Notas: {job.notas}</p>
                                            )}
                                        </div>
                                    ))}
                                    {savedJobs.length === 0 && (
                                        <p className="text-gray-500 text-center py-8">
                                            No tienes vacantes guardadas
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateDashboard;
