import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Trophy, Clock, Target, TrendingUp, TrendingDown,
    CheckCircle2, AlertTriangle, XCircle, Star, BarChart3,
    ChevronDown, ChevronUp, Calendar, Zap, Award, Activity,
    RefreshCw, Filter, Eye
} from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';

// ============================================================
// TYPES
// ============================================================
interface MemberMetric {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    vacantes_total: number;
    vacantes_cerradas: number;
    vacantes_abiertas: number;
    vacantes_canceladas: number;
    vacantes_vencidas: number;
    vacantes_mes: number;
    cerradas_mes: number;
    a_tiempo: number;
    tardias: number;
    tasa_cierre: number;
    tasa_eficiencia: number;
    prom_dias_cierre: number | null;
    candidatos_gestionados: number;
    con_entrevista: number;
    con_oferta: number;
    actualizados_semana: number;
    score_desempeno: number;
    vacantes_recientes: {
        id: number;
        nombre: string;
        estado: string;
        dias: number;
        tiempo_status: string;
        codigo: string;
        prioridad: string;
    }[];
}

interface TeamSummary {
    stats: {
        total_vacantes: number;
        total_cerradas: number;
        total_abiertas: number;
        prom_dias_cierre: number;
        a_tiempo: number;
        vencidas: number;
    };
    monthly_trend: { mes: string; cerradas: number }[];
}

// ============================================================
// HELPERS
// ============================================================
const getScoreColor = (score: number) => {
    if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'border-emerald-500/30 bg-emerald-500/5' };
    if (score >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500', ring: 'border-amber-500/30 bg-amber-500/5' };
    return { text: 'text-rose-400', bg: 'bg-rose-500', ring: 'border-rose-500/30 bg-rose-500/5' };
};

const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Sobresaliente';
    if (score >= 65) return 'Bueno';
    if (score >= 45) return 'En progreso';
    return 'Necesita apoyo';
};

const getTiempoIcon = (status: string) => {
    switch (status) {
        case 'on_time': return <CheckCircle2 size={12} className="text-emerald-400" />;
        case 'delayed': return <AlertTriangle size={12} className="text-amber-400" />;
        case 'overdue': return <XCircle size={12} className="text-rose-400" />;
        default: return <Clock size={12} className="text-blue-400" />;
    }
};

const formatMonth = (mes: string) => {
    const [year, month] = mes.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
};

const getRoleBadge = (rol: string) => {
    const map: Record<string, string> = {
        'Reclutador': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Lider': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Admin': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    return map[rol] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

// ============================================================
// RADIAL SCORE INDICATOR
// ============================================================
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 72 }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const colors = getScoreColor(score);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    strokeWidth={6}
                    strokeLinecap="round"
                    stroke={score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('font-black text-lg leading-none', colors.text)}>{score}</span>
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">pts</span>
            </div>
        </div>
    );
};

// ============================================================
// MINI BAR CHART — Monthly trend
// ============================================================
const MiniBarChart: React.FC<{ data: { mes: string; cerradas: number }[] }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.cerradas), 1);
    return (
        <div className="flex items-end gap-1.5 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full rounded-sm bg-indigo-500/70 transition-all" style={{ height: `${(d.cerradas / max) * 48}px` }} title={`${formatMonth(d.mes)}: ${d.cerradas}`} />
                    <span className="text-[8px] text-gray-600 font-bold">{formatMonth(d.mes)}</span>
                </div>
            ))}
        </div>
    );
};

// ============================================================
// MEMBER CARD
// ============================================================
const MemberCard: React.FC<{ member: MemberMetric; rank: number }> = ({ member, rank }) => {
    const [expanded, setExpanded] = useState(false);
    const colors = getScoreColor(member.score_desempeno);

    const initials = member.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

    const kpis = [
        { label: 'Vacantes Cerradas', value: member.vacantes_cerradas, sub: `de ${member.vacantes_total} total`, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Tasa de Cierre', value: `${member.tasa_cierre}%`, sub: member.cerradas_mes > 0 ? `${member.cerradas_mes} este mes` : 'Este mes: 0', icon: Target, color: 'text-indigo-400' },
        { label: 'Prom. Días Cierre', value: member.prom_dias_cierre ? `${member.prom_dias_cierre}d` : 'N/A', sub: member.a_tiempo > 0 ? `${member.a_tiempo} a tiempo` : 'Sin datos', icon: Clock, color: 'text-amber-400' },
        { label: 'Seguimiento', value: member.actualizados_semana, sub: 'actualiz. esta semana', icon: Activity, color: 'text-blue-400' },
    ];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('bg-[#0d1117] border rounded-2xl overflow-hidden transition-all', colors.ring)}
        >
            {/* Header */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Rank + Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-white">
                            {initials}
                        </div>
                        {rank <= 3 && (
                            <div className={cn(
                                'absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border',
                                rank === 1 ? 'bg-yellow-500 border-yellow-400 text-yellow-900' :
                                    rank === 2 ? 'bg-gray-300 border-gray-200 text-gray-700' :
                                        'bg-orange-600 border-orange-500 text-white'
                            )}>
                                {rank}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-black text-white truncate">{member.nombre}</h3>
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase border', getRoleBadge(member.rol))}>
                                {member.rol}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{member.email}</p>
                        <p className={cn('text-[10px] font-black mt-1 uppercase tracking-wider', colors.text)}>
                            {getScoreLabel(member.score_desempeno)}
                        </p>
                    </div>

                    {/* Score */}
                    <ScoreRing score={member.score_desempeno} />
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                            <kpi.icon size={14} className={cn('mx-auto mb-1', kpi.color)} />
                            <div className="text-lg font-black text-white">{kpi.value}</div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase leading-tight">{kpi.label}</div>
                            <div className="text-[8px] text-gray-700 mt-0.5">{kpi.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Progress Bars */}
                <div className="mt-4 space-y-2.5">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tasa de cierre</span>
                            <span className="text-[9px] font-black text-gray-400">{member.tasa_cierre}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${member.tasa_cierre}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={cn('h-full rounded-full', member.tasa_cierre >= 70 ? 'bg-emerald-500' : member.tasa_cierre >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Eficiencia (a tiempo)</span>
                            <span className="text-[9px] font-black text-gray-400">{member.tasa_eficiencia}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${member.tasa_eficiencia}%` }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className={cn('h-full rounded-full', member.tasa_eficiencia >= 70 ? 'bg-indigo-500' : member.tasa_eficiencia >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                            />
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 hover:text-gray-400 uppercase tracking-widest transition-colors py-1.5 border-t border-white/5"
                >
                    {expanded ? <><ChevronUp size={12} /> Ocultar detalle</> : <><Eye size={12} /> Ver vacantes recientes</>}
                </button>
            </div>

            {/* Expanded — Recent Vacancies */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="p-4 space-y-2 bg-white/[0.01]">
                            <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Vacantes asignadas recientes</h4>
                            {member.vacantes_recientes.length === 0 ? (
                                <p className="text-[10px] text-gray-600 text-center py-4">Sin vacantes asignadas registradas</p>
                            ) : (
                                member.vacantes_recientes.map((v, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="flex-shrink-0">{getTiempoIcon(v.tiempo_status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-white truncate">{v.nombre}</p>
                                            <p className="text-[9px] text-gray-600">{v.codigo}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-full text-[8px] font-black uppercase',
                                                v.estado === 'Cubierta' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    v.estado === 'Cancelada' ? 'bg-rose-500/10 text-rose-400' :
                                                        'bg-blue-500/10 text-blue-400'
                                            )}>{v.estado}</span>
                                            <span className="text-[9px] text-gray-600 font-bold">{v.dias}d</span>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Candidatos seguimiento */}
                            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-white/[0.02] rounded-xl">
                                    <div className="text-base font-black text-white">{member.candidatos_gestionados}</div>
                                    <div className="text-[8px] text-gray-600 uppercase font-bold">Candidatos</div>
                                </div>
                                <div className="text-center p-2 bg-white/[0.02] rounded-xl">
                                    <div className="text-base font-black text-indigo-400">{member.con_entrevista}</div>
                                    <div className="text-[8px] text-gray-600 uppercase font-bold">Entrevistas</div>
                                </div>
                                <div className="text-center p-2 bg-white/[0.02] rounded-xl">
                                    <div className="text-base font-black text-emerald-400">{member.con_oferta}</div>
                                    <div className="text-[8px] text-gray-600 uppercase font-bold">Ofertas</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ============================================================
// MAIN COMPONENT — Evaluations
// ============================================================
const Evaluations: React.FC = () => {
    const [team, setTeam] = useState<MemberMetric[]>([]);
    const [summary, setSummary] = useState<TeamSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'score' | 'cerradas' | 'eficiencia' | 'nombre'>('score');
    const [filterRol, setFilterRol] = useState<string>('all');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [teamRes, summaryRes] = await Promise.all([
                api.get('/evaluations/team'),
                api.get('/evaluations/summary'),
            ]);
            setTeam(teamRes.data.team || []);
            setSummary(summaryRes.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al cargar las evaluaciones');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = async () => {
        setRefreshing(true);
        await fetchData();
    };

    const sortedTeam = [...team]
        .filter(m => filterRol === 'all' || m.rol === filterRol)
        .sort((a, b) => {
            if (sortBy === 'score') return b.score_desempeno - a.score_desempeno;
            if (sortBy === 'cerradas') return b.vacantes_cerradas - a.vacantes_cerradas;
            if (sortBy === 'eficiencia') return b.tasa_eficiencia - a.tasa_eficiencia;
            if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre);
            return 0;
        });

    const roles = ['all', ...Array.from(new Set(team.map(m => m.rol)))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse">
                        <Award size={28} className="text-white" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Cargando evaluaciones del equipo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">Error al cargar datos</p>
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* ---- HEADER ---- */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/30">
                            <Award size={22} className="text-white" />
                        </div>
                        Evaluaciones de Equipo
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                        Análisis de desempeño · {team.length} integrantes · Actualizado ahora
                    </p>
                </div>
                <button
                    onClick={refresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* ---- GLOBAL KPIs ---- */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Vacantes', value: summary.stats.total_vacantes, icon: Database2, color: 'indigo', sub: 'en el sistema' },
                        { label: 'Cerradas', value: summary.stats.total_cerradas, icon: CheckCircle2, color: 'emerald', sub: 'cubiertas' },
                        { label: 'Abiertas', value: summary.stats.total_abiertas, icon: Clock, color: 'blue', sub: 'en proceso' },
                        { label: 'Vencidas', value: summary.stats.vencidas, icon: AlertTriangle, color: 'rose', sub: 'sin cerrar' },
                        { label: 'Días Promedio', value: summary.stats.prom_dias_cierre ? `${summary.stats.prom_dias_cierre}d` : 'N/A', icon: TrendingUp, color: 'amber', sub: 'cierre promedio' },
                        { label: 'A Tiempo', value: summary.stats.a_tiempo, icon: Trophy, color: 'violet', sub: 'antes del plazo' },
                    ].map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                'p-4 rounded-2xl border text-center',
                                kpi.color === 'indigo' ? 'bg-indigo-500/5 border-indigo-500/20' :
                                    kpi.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        kpi.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' :
                                            kpi.color === 'rose' ? 'bg-rose-500/5 border-rose-500/20' :
                                                kpi.color === 'amber' ? 'bg-amber-500/5 border-amber-500/20' :
                                                    'bg-violet-500/5 border-violet-500/20'
                            )}
                        >
                            <div className="text-2xl font-black text-white mb-0.5">{kpi.value}</div>
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{kpi.label}</div>
                            <div className="text-[8px] text-gray-700 mt-0.5">{kpi.sub}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ---- MONTHLY TREND + LEADERBOARD PREVIEW ---- */}
            {summary && summary.monthly_trend.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Trend chart */}
                    <div className="lg:col-span-2 bg-[#0d1117] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-indigo-400" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">Vacantes Cerradas — Últimos 6 meses</span>
                        </div>
                        <MiniBarChart data={summary.monthly_trend} />
                    </div>

                    {/* Top 3 Podium */}
                    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={16} className="text-amber-400" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">Top Desempeño</span>
                        </div>
                        <div className="space-y-2">
                            {sortedTeam.slice(0, 3).map((m, i) => {
                                const medals = ['🥇', '🥈', '🥉'];
                                const colors = getScoreColor(m.score_desempeno);
                                return (
                                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
                                        <span className="text-lg">{medals[i]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-white truncate">{m.nombre}</p>
                                            <p className="text-[9px] text-gray-500">{m.vacantes_cerradas} cerradas</p>
                                        </div>
                                        <span className={cn('text-sm font-black', colors.text)}>{m.score_desempeno}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ---- FILTERS & SORT ---- */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-500">Filtrar por rol:</span>
                    {roles.map(rol => (
                        <button
                            key={rol}
                            onClick={() => setFilterRol(rol)}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
                                filterRol === rol
                                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                                    : 'bg-white/3 border-white/8 text-gray-500 hover:text-gray-400'
                            )}
                        >
                            {rol === 'all' ? 'Todos' : rol}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Ordenar:</span>
                    {[
                        { key: 'score', label: 'Puntaje' },
                        { key: 'cerradas', label: 'Cerradas' },
                        { key: 'eficiencia', label: 'Eficiencia' },
                        { key: 'nombre', label: 'Nombre' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSortBy(s.key as any)}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border',
                                sortBy === s.key
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-white/3 border-white/8 text-gray-500 hover:text-gray-400'
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ---- TEAM CARDS ---- */}
            {sortedTeam.length === 0 ? (
                <div className="text-center py-20 bg-[#0d1117] border border-white/5 rounded-2xl">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">No hay integrantes de equipo registrados</p>
                    <p className="text-gray-600 text-xs mt-2">Crea usuarios con rol Reclutador o Lider para ver evaluaciones</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {sortedTeam.map((member, i) => (
                        <MemberCard key={member.id} member={member} rank={i + 1} />
                    ))}
                </div>
            )}

            {/* ---- FOOTER LEGEND ---- */}
            <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Cómo se calcula el puntaje de desempeño</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Tasa de Cierre (40%)', desc: 'Porcentaje de vacantes cerradas sobre el total asignado', color: 'text-emerald-400' },
                        { label: 'Eficiencia Temporal (30%)', desc: 'Porcentaje de vacantes cerradas antes del plazo estimado', color: 'text-indigo-400' },
                        { label: 'Velocidad de Cierre (30%)', desc: 'Penalización por días promedio altos respecto al estándar (15 días base)', color: 'text-amber-400' },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-2">
                            <Star size={12} className={cn('flex-shrink-0 mt-0.5', item.color)} />
                            <div>
                                <p className={cn('text-[9px] font-black uppercase tracking-wider', item.color)}>{item.label}</p>
                                <p className="text-[9px] text-gray-600 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Alias for missing import
const Database2 = BarChart3;

export default Evaluations;
