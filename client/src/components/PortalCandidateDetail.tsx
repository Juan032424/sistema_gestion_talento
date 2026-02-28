import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Calendar, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import api from '../api';
import ActivityLogViewer from './ActivityLogViewer';

interface CandidateDetail {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    ubicacion: string;
    titulo_profesional: string;
    experiencia_total_anos: number;
    nivel_educacion: string;
    created_at: string;
    email_verified: boolean;
}

const PortalCandidateDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidateDetail();
    }, [id]);

    const fetchCandidateDetail = async () => {
        try {
            const res = await api.get(`/candidates/portal/${id}`);
            setCandidate(res.data);
        } catch (error) {
            console.error('Error fetching candidate detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Candidato no encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/portal-candidates')}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                    <ChevronLeft size={20} className="text-gray-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white">
                        {candidate.nombre} {candidate.apellido}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{candidate.titulo_profesional || 'Sin título especificado'}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Mail size={16} className="text-blue-400" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Email</p>
                    </div>
                    <p className="text-sm text-white font-medium">{candidate.email}</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Phone size={16} className="text-emerald-400" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Teléfono</p>
                    </div>
                    <p className="text-sm text-white font-medium">{candidate.telefono || 'No especificado'}</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin size={16} className="text-amber-400" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Ubicación</p>
                    </div>
                    <p className="text-sm text-white font-medium">{candidate.ubicacion || 'No especificada'}</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase size={16} className="text-indigo-400" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Experiencia</p>
                    </div>
                    <p className="text-sm text-white font-medium">{candidate.experiencia_total_anos || 0} años</p>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <GraduationCap size={16} className="text-blue-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Educación</h3>
                    </div>
                    <p className="text-sm text-gray-400">{candidate.nivel_educacion || 'No especificado'}</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Calendar size={16} className="text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Fecha de Registro</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        {new Date(candidate.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>

            {/* Activity Section - Using the same ActivityLogViewer component */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <User size={16} className="text-blue-400" />
                    </div>
                    Actividad en el Portal
                </h2>
                <ActivityLogViewer candidateTrackingId={Number(id)} />
            </div>
        </div>
    );
};

export default PortalCandidateDetail;
