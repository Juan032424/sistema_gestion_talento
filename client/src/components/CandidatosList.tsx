import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useToast } from './ToastNotification';
import type { Candidato } from '../types';
import {
    Filter,
    Download,
    Edit2,
    Users,
    Plus,
    Zap,
    X,
    Phone,
    Mail,
    MapPin,
    GraduationCap,
    Briefcase,
    Calendar,
    Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

const CandidatosList: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const highlightId = queryParams.get('highlight');

    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidato, setSelectedCandidato] = useState<any>(null);

    // Filter candidates for "Focus View" when coming from a notification
    const filteredCandidatos = highlightId
        ? candidatos.filter(c => String(c.id) === String(highlightId))
        : candidatos;

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading && highlightId && candidatos.length > 0) {
            setTimeout(() => {
                const element = document.getElementById(`row-candidate-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [loading, highlightId, candidatos]);

    const canEdit = user && ['Superadmin', 'Admin', 'Reclutador'].includes(user.role);

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

    const handleCandidatoEdit = (c: Candidato) => {
        navigate(`/edit-candidato/${c.id}`);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-4 border-[#3a94cc]/20 border-t-[#3a94cc] rounded-full"
            />
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
                    {canEdit && (
                        <button
                            onClick={() => navigate('/create-candidato')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e4b7a] text-white rounded-xl text-xs font-bold hover:bg-[#3a94cc] transition-all shadow-lg shadow-[#1e4b7a]/20"
                        >
                            <Plus size={14} />
                            Registrar Candidato
                        </button>
                    )}
                    {highlightId && (
                        <button
                            onClick={() => navigate('/candidatos')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all animate-pulse"
                        >
                            <Users size={14} />
                            Ver Todos los Candidatos
                        </button>
                    )}
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
                        <tbody className="divide-y divide-white/5 text-[13px]">
                            {filteredCandidatos.map((c) => {
                                const isHighlighted = highlightId && String(c.id) === String(highlightId);
                                return (
                                    <tr
                                        key={c.id}
                                        id={`row-candidate-${c.id}`}
                                        className={cn(
                                            "hover:bg-white/[0.04] transition-all group cursor-pointer",
                                            isHighlighted ? "bg-blue-600/20 border-l-4 border-blue-500 relative z-10" : ""
                                        )}
                                        onClick={() => setSelectedCandidato(c)}
                                    >
                                        <td className="p-4 font-bold text-white">
                                            <div className="flex items-center gap-2">
                                                {isHighlighted && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
                                                {c.nombre_candidato}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs transition-colors">
                                            <div className={cn(
                                                "truncate max-w-[150px] font-black uppercase tracking-tight",
                                                isHighlighted ? "animate-pulse-vacancy text-white" : "text-gray-400"
                                            )}>
                                                {(c as any).puesto_nombre}
                                            </div>
                                            <div className="text-[10px] text-gray-600 font-mono">{(c as any).codigo_requisicion}</div>
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
                                                <a href={c.cv_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#3a94cc] hover:underline text-[10px]">
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
                                                c.resultado_candidato === 'Apto' ? "bg-emerald-500/10 text-emerald-500" :
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
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setSelectedCandidato(c)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Eye size={16} /></button>
                                                {canEdit && (
                                                    <button onClick={() => handleCandidatoEdit(c)} className="p-2 text-gray-500 hover:text-[#3a94cc] hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {candidatos.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="p-12 text-center text-gray-600 italic text-sm">No hay candidatos registrados para seguimiento.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {selectedCandidato && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidato(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-auto overflow-y-auto custom-scrollbar"
                        >
                            {/* Left Side: Avatar \u0026 Basic Info */}
                            <div className="p-8 bg-white/[0.02] border-r border-white/5 md:w-80 flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-tr from-[#3a94cc] to-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/20 mb-6">
                                    {selectedCandidato.nombre_candidato[0]}
                                </div>
                                <h3 className="text-xl font-black text-white text-center mb-2">{selectedCandidato.nombre_candidato}</h3>
                                <div className="flex items-center gap-2 mb-8">
                                    <Zap size={14} className="text-indigo-400" />
                                    <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Score IA: {(selectedCandidato as any).score_tecnico_ia || '0'}%</span>
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Estado Actual</p>
                                        <p className="text-sm font-bold text-[#3a94cc]">{selectedCandidato.etapa_actual}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Fuente</p>
                                        <p className="text-sm font-bold text-white">{selectedCandidato.fuente_reclutamiento}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleCandidatoEdit(selectedCandidato)}
                                    className="mt-auto w-full py-4 bg-[#161b22] border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
                                >
                                    Editar Perfil
                                </button>
                            </div>

                            {/* Right Side: Detailed Info */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Información Detallada</h4>
                                        <p className="text-lg font-bold text-white">Perfil Profesional</p>
                                    </div>
                                    <button onClick={() => setSelectedCandidato(null)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                    <DetailBox icon={<Phone size={16} />} label="Teléfono" value={selectedCandidato.telefono || 'No disponible'} />
                                    <DetailBox icon={<Mail size={16} />} label="Correo Electrónico" value={selectedCandidato.email || 'No disponible'} />
                                    <DetailBox icon={<MapPin size={16} />} label="Ubicación" value={selectedCandidato.ciudad || 'Cartagena'} />
                                    <DetailBox icon={<GraduationCap size={16} />} label="Educación" value={selectedCandidato.titulo_profesional || 'No especifiée'} />
                                    <DetailBox icon={<Briefcase size={16} />} label="Experiencia" value={`${selectedCandidato.experiencia_total_anos || 0} años`} />
                                    <DetailBox icon={<Calendar size={16} />} label="Postulado el" value={selectedCandidato.fecha_postulacion ? new Date(selectedCandidato.fecha_postulacion).toLocaleDateString() : 'Desconocido'} />
                                </div>

                                <div className="mb-12">
                                    <h4 className="text-[10px] uppercase font-black text-[#3a94cc] tracking-widest mb-4">Vacante Vinculada</h4>
                                    <div className="p-6 bg-[#161b22] rounded-3xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Briefcase size={80} className="-rotate-12" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-xl font-black text-white mb-1">{(selectedCandidato as any).puesto_nombre}</p>
                                            <p className="text-xs font-mono text-gray-500">{(selectedCandidato as any).codigo_requisicion}</p>

                                            <div className="mt-6 flex flex-wrap gap-3">
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">{(selectedCandidato as any).sede_nombre || 'Sede Cartagena'}</span>
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">{(selectedCandidato as any).proceso_nombre || 'Operativo'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-4">Feedback \u0026 Notas</h4>
                                    <div className="p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl">
                                        <p className="text-sm line-height-relaxed text-gray-400 italic">
                                            {selectedCandidato.resumen_ia_entrevista ?
                                                JSON.parse(selectedCandidato.resumen_ia_entrevista) :
                                                "Evaluación preliminar completada. El candidato muestra interés en el cargo y cumple con los requisitos mínimos de experiencia académica."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(58, 148, 204, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(58, 148, 204, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(58, 148, 204, 0); }
                }
                @keyframes pulse-vacancy {
                    0% { color: #3a94cc; text-shadow: 0 0 5px #3a94cc; opacity: 1; transform: scale(1); }
                    50% { color: #ffffff; text-shadow: 0 0 25px #00ffff, 0 0 50px #00ffff; opacity: 0.5; transform: scale(1.1); }
                    100% { color: #3a94cc; text-shadow: 0 0 5px #3a94cc; opacity: 1; transform: scale(1); }
                }
                .animate-pulse-vacancy {
                    animation: pulse-vacancy 0.5s infinite ease-in-out;
                    display: inline-block;
                    font-weight: 900 !important;
                }
                @keyframes row-glow {
                    0% { background-color: rgba(58, 148, 204, 0.1); }
                    50% { background-color: rgba(58, 148, 204, 0.3); }
                    100% { background-color: rgba(58, 148, 204, 0.1); }
                }
                .bg-blue-600\/20 {
                    animation: row-glow 1s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

const DetailBox: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] uppercase font-black text-gray-600 tracking-wider mb-0.5">{label}</p>
            <p className="text-xs font-bold text-gray-300 truncate">{value}</p>
        </div>
    </div>
);

export default CandidatosList;
