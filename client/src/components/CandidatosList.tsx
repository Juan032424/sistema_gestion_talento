import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from './ToastNotification';
import type { Candidato } from '../types';
import {
    Filter,
    Download,
    Edit2,
    Users,
    Plus,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

const CandidatosList: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/candidatos');
            setCandidatos(res.data);
        } catch (error) {
            console.error("Error fetching data", error);
            showToast("Error al cargar listados", "error");
        } finally {
            setLoading(false);
        }
    };

    // Candidate actions
    const handleCandidatoEdit = (c: Candidato) => {
        navigate(`/edit-candidato/${c.id}`);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-10 h-10 border-4 border-[#3a94cc]/20 border-t-[#3a94cc] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Users className="text-[#3a94cc]" />
                        Gestión de Candidatos
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Base de talento y seguimiento de postulaciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                        <Filter size={14} />
                        Filtros
                    </button>
                    <button
                        onClick={() => navigate('/create-candidato')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e4b7a] text-white rounded-xl text-xs font-bold hover:bg-[#3a94cc] transition-all shadow-lg shadow-[#1e4b7a]/20"
                    >
                        <Plus size={14} />
                        Registrar Candidato
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                        <Download size={14} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* CANDIDATES TABLE */}
            <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1500px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#0d1117] border-b border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-4 whitespace-nowrap">Nombre Candidato</th>
                                <th className="p-4 whitespace-nowrap">Vacante</th>
                                <th className="p-4 whitespace-nowrap">Etapa</th>
                                <th className="p-4 whitespace-nowrap">Fuente</th>
                                <th className="p-4 whitespace-nowrap">HV / CV</th>
                                <th className="p-4 whitespace-nowrap">Etdo. Entrevista</th>
                                <th className="p-4 whitespace-nowrap">Fecha Entrevista</th>
                                <th className="p-4 whitespace-nowrap">Resultado</th>
                                <th className="p-4 whitespace-nowrap">Motivo No Apto</th>
                                <th className="p-4 whitespace-nowrap">Score Técnico</th>
                                <th className="p-4 whitespace-nowrap">AI Match (%)</th>
                                <th className="p-4 whitespace-nowrap">Analítica 90D</th>
                                <th className="p-4 whitespace-nowrap">Sentiment</th>
                                <th className="p-4 whitespace-nowrap text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {candidatos.map((c) => (
                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 font-bold text-white text-sm">{c.nombre_candidato}</td>
                                    <td className="p-4 text-xs text-gray-400">
                                        <div className="truncate max-w-[150px]">{(c as any).puesto_nombre}</div>
                                        <div className="text-[10px] text-gray-600">{(c as any).codigo_requisicion}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-[#3a94cc]/10 text-[#3a94cc] text-[10px] font-bold uppercase tracking-tight">
                                            {c.etapa_actual}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-400 font-medium">{c.fuente_reclutamiento}</span>
                                    </td>
                                    <td className="p-4">
                                        {c.cv_url ? (
                                            <a href={c.cv_url} target="_blank" rel="noreferrer" className="text-[#3a94cc] hover:underline text-[10px]">
                                                Ver CV
                                            </a>
                                        ) : <span className="text-gray-600 text-[10px]">Sin CV</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                                            c.estado_entrevista === 'Realizada' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-gray-400"
                                        )}>{c.estado_entrevista}</span>
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="text-gray-500">{c.fecha_entrevista ? new Date(c.fecha_entrevista).toLocaleDateString() : '—'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                                            c.resultado_candidato === 'Apto' ? "bg-[#3a94cc]/10 text-[#3a94cc]" :
                                                c.resultado_candidato === 'No Apto' ? "bg-red-500/10 text-red-500" : "bg-white/5 text-gray-500"
                                        )}>{c.resultado_candidato || 'Pendiente'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-500 truncate block max-w-[150px]">{c.motivo_no_apto || '—'}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            <span className={cn(
                                                "text-xs font-bold",
                                                (c.calificacion_tecnica || 0) >= 4 ? "text-green-500" : (c.calificacion_tecnica || 0) >= 3 ? "text-amber-500" : "text-red-500"
                                            )}>{c.calificacion_tecnica || '0.0'}</span>
                                            <span className="text-[10px] text-gray-600">/ 5.0</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <Zap size={10} className="text-indigo-400" />
                                                <span className="text-xs font-black text-indigo-400">{(c as any).score_tecnico_ia || '0'}%</span>
                                            </div>
                                            <div className="w-16 bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                                                <div className="bg-indigo-500 h-full" style={{ width: `${(c as any).score_tecnico_ia || 0}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-400 font-medium">{c.estatus_90_dias || '—'}</span>
                                    </td>
                                    <td className="p-4">
                                        {(c as any).offboarding_sentiment ? (
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                                                (c as any).offboarding_sentiment === 'Positive' ? "bg-emerald-500/10 text-emerald-500" :
                                                    (c as any).offboarding_sentiment === 'Negative' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                            )}>{(c as any).offboarding_sentiment}</span>
                                        ) : <span className="text-gray-600 text-[9px] italic">No Data</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleCandidatoEdit(c)} className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {candidatos.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="p-12 text-center text-gray-600 italic text-sm">No hay candidatos registrados para seguimiento.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal removed in favor of full page form */}
        </div>
    );
};

export default CandidatosList;
