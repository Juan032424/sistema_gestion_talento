import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, ChevronRight, LogIn } from 'lucide-react';
import api from '../../api';
import { useCandidateAuth } from '../../context/CandidateAuthContext';

interface IErpApplication {
    application_id: string; // RA
    resultado_evaluacion: string;
    experiencia_requerida: string;
    estado_ra: string;
    fecha_postulacion: string;
    
    vacancy_id: string; // RP
    puesto_nombre: string;
    estado_rp: string;
    solicitante_nombre: string;
    
    contract_id?: string; // RC
    estado_rc?: string;
    emo_pdf?: string;
    identificacion_pdf?: string;
    hoja_vida_pdf?: string;
}

const MyApplications: React.FC = () => {
    const [applications, setApplications] = useState<IErpApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useCandidateAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchMyApplications();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchMyApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/candidates/applications');
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            // No hacemos nada si falla el fetch por 401, el usuario verá estado vacío o loading falso
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: string | undefined) => {
        if (!estado) return 'from-gray-500/20 to-slate-600/20 border-gray-400/30 text-gray-400';
        switch (estado) {
            case 'Contratado':
            case 'Regular':
            case 'Seleccionado':
                return 'from-green-500/20 to-emerald-600/20 border-green-400/30 text-green-400';
            case 'Entrevista':
            case 'Preseleccionado':
            case 'En proceso':
                return 'from-blue-500/20 to-cyan-600/20 border-blue-400/30 text-blue-400';
            case 'En Revisión':
            case 'Nueva':
            case 'Pendiente':
                return 'from-yellow-500/20 to-orange-600/20 border-yellow-400/30 text-yellow-400';
            case 'Descartado':
            case 'Retirado':
            case 'No apto':
            case 'No Aprobada':
                return 'from-red-500/20 to-rose-600/20 border-red-400/30 text-red-400';
            default:
                return 'from-gray-500/20 to-slate-600/20 border-gray-400/30 text-gray-400';
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return `Hace ${Math.floor(diffDays / 30)} meses`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Briefcase size={24} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 min-h-screen">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="text-gray-400" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Inicia Sesión</h2>
                <p className="text-gray-400 max-w-md mb-8 text-lg">
                    Inicia sesión para ver tu historial de postulaciones, estados y seguimiento.
                </p>
                <div className="flex gap-4">
                    <a href="/portal" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-white/10">
                        Volver al Portal
                    </a>
                    <button
                        onClick={() => document.getElementById('login-modal-trigger')?.click()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Mis Aplicaciones</h1>
                    <p className="text-gray-400">Seguimiento de tus postulaciones en tiempo real</p>
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-white/10">
                            <Briefcase size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No tienes aplicaciones aún</h3>
                        <p className="text-gray-400 mb-6">Comienza a explorar vacantes y postúlate</p>
                        <a
                            href="/portal"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all"
                        >
                            Explorar Vacantes
                            <ChevronRight size={18} />
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {applications.map((app) => (
                            <div
                                key={app.application_id}
                                className="group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1">{app.puesto_nombre}</h3>
                                            <p className="text-gray-400 text-sm">Proceso: {app.application_id || 'N/A'}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl border bg-gradient-to-br ${getEstadoColor(app.estado_ra)} font-semibold text-sm`}>
                                            {app.estado_ra || 'Aplicación'}
                                        </div>
                                    </div>

                                    {/* Stepper (RP -> RA -> RC) */}
                                    <div className="mb-8 px-2 relative">
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 -translate-y-1/2"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            {/* RP - Requisición */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${app.vacancy_id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                    RP
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-semibold text-white">{app.vacancy_id || 'Pendiente'}</p>
                                                    <p className="text-[10px] text-gray-400">{app.estado_rp || 'Requisición'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`flex-1 h-0.5 ${app.application_id ? 'bg-blue-600' : 'bg-transparent'}`}></div>

                                            {/* RA - Registro Aspirante */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${app.application_id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                    RA
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-semibold text-white">{app.application_id || 'Pendiente'}</p>
                                                    <p className="text-[10px] text-gray-400">{app.estado_ra || 'Postulación'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`flex-1 h-0.5 ${app.contract_id ? 'bg-green-500' : 'bg-transparent'}`}></div>

                                            {/* RC - Registro Contratación */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${app.contract_id ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                                                    RC
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-semibold text-white">{app.contract_id || 'Pendiente'}</p>
                                                    <p className="text-[10px] text-gray-400">{app.estado_rc || 'Vinculación'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Calendar size={16} className="text-gray-500" />
                                            <span>Aplicaste {getTimeAgo(app.fecha_postulacion)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {app.contract_id && (
                                        <div className="flex gap-3 mt-4">
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    alert('Descargando Documentos de Vinculación...');
                                                }}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 group/btn"
                                            >
                                                Descargar Documentos de Vinculación (RC)
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyApplications;

