import React, { useState, useEffect } from 'react';
import { History, Layout, LogIn, Briefcase, UserCircle, Star, Trash2, Clock, X, Bot, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';

interface Log {
    id: number;
    activity_type: string;
    description: string;
    related_id: number;
    metadata: any;
    created_at: string;
}

interface AIAnalysis {
    summary: string;
    engagement_level: string;
    key_patterns: string[];
    recommendation: string;
}

interface ActivityLogsProps {
    candidateTrackingId: number;
}

const ActivityLogViewer: React.FC<ActivityLogsProps> = ({ candidateTrackingId }) => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get(`/candidatos/${candidateTrackingId}/activity`);
                setLogs(res.data);
            } catch (error) {
                console.error("Error fetching logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [candidateTrackingId]);

    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await api.post(`/candidatos/${candidateTrackingId}/analyze-behavior`);
            setAnalysis(res.data);
        } catch (error) {
            console.error("Error analyzing behavior", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'LOGIN': return <LogIn size={16} className="text-blue-400" />;
            case 'VIEW_JOB': return <Layout size={16} className="text-indigo-400" />;
            case 'APPLY': return <Briefcase size={16} className="text-emerald-400" />;
            case 'UPDATE_PROFILE': return <UserCircle size={16} className="text-amber-400" />;
            case 'SAVE_JOB': return <Star size={16} className="text-yellow-400" />;
            case 'REMOVE_SAVED_JOB': return <Trash2 size={16} className="text-red-400" />;
            case 'REGISTER': return <UserCircle size={16} className="text-blue-500" />;
            case 'START_APPLICATION': return <Briefcase size={16} className="text-blue-300" />;
            case 'ABANDON_APPLICATION': return <X size={16} className="text-red-300" />;
            default: return <History size={16} className="text-gray-400" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="text-gray-500 text-xs animate-pulse p-4">Cargando actividad...</div>;

    if (logs.length === 0) return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center">
            <History size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No hay registro de actividad para este candidato en el portal público.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* AI Strategic Analysis Box */}
            <div className={cn(
                "relative overflow-hidden rounded-2xl border transition-all duration-500",
                analysis
                    ? "bg-indigo-600/5 border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                    : "bg-slate-900/40 border-white/5"
            )}>
                {/* Header with Sparkles if analyzed */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            analysis ? "bg-indigo-600 text-white" : "bg-slate-800 text-gray-400"
                        )}>
                            <Bot size={18} className={analyzing ? "animate-bounce" : ""} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">SHEYLA Behavior Insights</h4>
                            <p className="text-[10px] text-gray-500 font-medium">Análisis predictivo del perfil de interés</p>
                        </div>
                    </div>

                    <button
                        onClick={handleAIAnalysis}
                        disabled={analyzing || logs.length === 0}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            analyzing
                                ? "bg-indigo-600/20 text-indigo-400 cursor-wait"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                        )}
                    >
                        {analyzing ? (
                            <>Analizando...</>
                        ) : (
                            <>
                                <Sparkles size={12} />
                                {analysis ? 'Recalcular' : 'Generar Análisis IA'}
                            </>
                        )}
                    </button>
                </div>

                {/* Analysis Content */}
                {analysis ? (
                    <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Resumen de Comportamiento</span>
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                        {analysis.summary}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.key_patterns.map((pattern, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[9px] font-bold text-indigo-300">
                                            #{pattern}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nivel de Engagement</span>
                                        <TrendingUp size={14} className="text-emerald-400" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className={cn(
                                            "text-2xl font-black",
                                            analysis.engagement_level === 'High' ? "text-emerald-400" :
                                                analysis.engagement_level === 'Medium' ? "text-amber-400" : "text-gray-400"
                                        )}>
                                            {analysis.engagement_level}
                                        </span>
                                        <div className="flex gap-0.5 mb-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={cn(
                                                    "w-1.5 h-3 rounded-full",
                                                    (analysis.engagement_level === 'High' && i <= 3) || (analysis.engagement_level === 'Medium' && i <= 2) || (analysis.engagement_level === 'Low' && i === 1)
                                                        ? (analysis.engagement_level === 'High' ? "bg-emerald-500" : analysis.engagement_level === 'Medium' ? "bg-amber-500" : "bg-gray-500")
                                                        : "bg-white/10"
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-indigo-400" />
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recomendación IA</span>
                                    </div>
                                    <p className="text-[11px] text-white font-bold leading-tight">
                                        {analysis.recommendation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <TrendingUp size={24} className="mx-auto text-gray-700 mb-3 opacity-20" />
                        <p className="text-[11px] text-gray-600 font-medium italic">
                            Solicita un análisis estratégico basado en los {logs.length} eventos registrados para entender la intención real del candidato.
                        </p>
                    </div>
                )}
            </div>

            {/* Standard Log List */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-blue-400" />
                        Historial de Eventos Crudos
                    </h3>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        {logs.length} Eventos
                    </span>
                </div>
                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-all group">
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                                    {getIcon(log.activity_type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <span className="text-xs font-bold text-white uppercase tracking-tight">
                                            {log.activity_type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                                            <Clock size={10} />
                                            {formatTime(log.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                        {log.description}
                                    </p>

                                    {/* Muestra metadata si existe y tiene algo relevante */}
                                    {log.metadata && Object.keys(log.metadata).length > 0 && typeof log.metadata === 'object' && (
                                        <div className="mt-2 text-[10px] text-gray-600 bg-black/20 p-2 rounded-lg border border-white/5 font-mono">
                                            {JSON.stringify(log.metadata)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-[9px] text-gray-600 italic px-2">
                * Este historial sólo incluye acciones realizadas por el candidato después de iniciar sesión en el portal público.
            </p>
        </div>
    );
};

export default ActivityLogViewer;
