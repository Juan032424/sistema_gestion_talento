import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Calendar, Activity, Mail, Phone, CheckCircle, XCircle, User } from 'lucide-react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface PortalCandidate {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    titulo_profesional: string;
    created_at: string;
    email_verified: boolean;
    activity_count?: number;
    last_login?: string;
}

const PortalCandidatesList: React.FC = () => {
    const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await api.get('/candidates/portal/all');
            setCandidates(res.data);
        } catch (error) {
            console.error('Error fetching portal candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm animate-pulse">Cargando candidatos del portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Users size={20} className="text-white" />
                        </div>
                        Portal Público
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">
                        Candidatos registrados en el portal de empleo
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-1">Total Registrados</p>
                    <p className="text-3xl font-black text-white">{candidates.length}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-1">Verificados</p>
                            <p className="text-2xl font-black text-emerald-400">
                                {candidates.filter(c => c.email_verified).length}
                            </p>
                        </div>
                        <CheckCircle className="text-emerald-400" size={24} />
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-1">Pendientes</p>
                            <p className="text-2xl font-black text-amber-400">
                                {candidates.filter(c => !c.email_verified).length}
                            </p>
                        </div>
                        <XCircle className="text-amber-400" size={24} />
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-1">Con Actividad</p>
                            <p className="text-2xl font-black text-blue-400">
                                {candidates.filter(c => c.activity_count && c.activity_count > 0).length}
                            </p>
                        </div>
                        <Activity className="text-blue-400" size={24} />
                    </div>
                </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Candidato
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Contacto
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Registro
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Actividad
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCandidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center">
                                                <User size={18} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">
                                                    {candidate.nombre} {candidate.apellido}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {candidate.titulo_profesional || 'Sin título'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Mail size={12} />
                                                {candidate.email}
                                            </div>
                                            {candidate.telefono && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Phone size={12} />
                                                    {candidate.telefono}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {candidate.email_verified ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs font-bold text-emerald-400">
                                                <CheckCircle size={12} />
                                                Verificado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs font-bold text-amber-400">
                                                <XCircle size={12} />
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            {formatDate(candidate.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Activity size={14} className={cn(
                                                candidate.activity_count && candidate.activity_count > 0 ? "text-blue-400" : "text-gray-600"
                                            )} />
                                            <span className={cn(
                                                "text-sm font-bold",
                                                candidate.activity_count && candidate.activity_count > 0 ? "text-white" : "text-gray-600"
                                            )}>
                                                {candidate.activity_count || 0} eventos
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => navigate(`/portal-candidate/${candidate.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Eye size={14} />
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCandidates.length === 0 && (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                        <p className="text-gray-500 text-sm">
                            {searchTerm ? 'No se encontraron candidatos con ese criterio' : 'No hay candidatos registrados en el portal aún'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortalCandidatesList;
