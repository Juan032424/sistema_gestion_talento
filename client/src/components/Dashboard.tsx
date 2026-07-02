import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../api';
import type { Stats, Vacante } from '../types';
import {
    Timer,
    Target,
    AlertCircle,
    MoreHorizontal,
    Briefcase,
    Zap,
    Lightbulb,
    HelpCircle,
    Filter,
    Calendar,
    MapPin,
    Search,
    RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PremiumSelect } from './ui/PremiumComponents';
import { DataTable, type ColumnDef } from './ui/DataTable';
import { SkeletonDashboard } from './ui/Skeleton';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        periodo: '2026-01',
        sede_id: '',
        vacante_id: ''
    });
    const [sedes, setSedes] = useState<any[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [sedesRes] = await Promise.all([
                    api.get('/sedes')
                ]);
                setSedes(sedesRes.data);
            } catch (error) {
                console.error("Error fetching filter metadata", error);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.periodo) params.append('periodo', filters.periodo);
            if (filters.sede_id) params.append('sede_id', filters.sede_id);
            if (filters.vacante_id) params.append('id', filters.vacante_id);

            const [statsRes, vacantesRes] = await Promise.all([
                api.get(`/vacantes/stats?${params.toString()}`),
                api.get(`/vacantes?${params.toString()}`)
            ]);
            
            setStats(statsRes.data);
            const vData = vacantesRes.data;
            setVacantes(Array.isArray(vData) ? vData : (vData?.data || []));
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ periodo: '2026-01', sede_id: '', vacante_id: '' });
    };

    const periodos = [
        { value: '2026-01', label: 'Enero 2026 (Actual)' },
        { value: '2026-02', label: 'Febrero 2026' },
        { value: '2026-03', label: 'Marzo 2026' },
        { value: '2026-Q1', label: 'Q1 2026' },
        { value: '2024-HIST', label: 'Histórico 2024' },
        { value: 'HISTORICO', label: 'Histórico Completo' }
    ];

    if (loading && !stats) return (
        <SkeletonDashboard />
    );

    const barData = {
        labels: stats?.geoDistribution?.map((g: any) => g.sede) || [],
        datasets: [{
            label: 'Vacantes Activas',
            data: stats?.geoDistribution?.map((g: any) => g.count) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderRadius: 12,
            maxBarThickness: 40,
        }]
    };

    const getSlaInfo = (v: Vacante) => {
        const now = new Date();
        const estim = new Date(v.fecha_cierre_estimada);
        const diffDays = Math.ceil((estim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (v.estado === 'Cubierta') return { label: 'Completado', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
        if (diffDays < 0) return { label: `Vencido (${Math.abs(diffDays)}d)`, color: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' };
        if (diffDays <= 3) return { label: `Urgente (${diffDays}d)`, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        return { label: `${diffDays} días restantes`, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    };

    const columns: ColumnDef<Vacante>[] = [
        {
            header: "Sede / Ubicación",
            accessorKey: "puesto_nombre",
            sortable: true,
            cell: (v) => (
                <div className="flex flex-col py-1">
                    <span className="text-sm font-semibold hover:text-blue-400 transition-colors uppercase tracking-tight text-white">{v.puesto_nombre}</span>
                    <span className="text-[11px] mt-0.5 text-gray-500">{v.sede_nombre}</span>
                </div>
            )
        },
        {
            header: "Responsable",
            accessorKey: "responsable_rh",
            sortable: true,
            cell: (v) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#055098]/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                        {(v.responsable_rh || 'U').substring(0, 1)}
                    </div>
                    <span className="text-xs text-gray-400">{v.responsable_rh}</span>
                </div>
            )
        },
        {
            header: "Status",
            id: "status",
            sortable: false,
            cell: (v) => {
                const info = getSlaInfo(v);
                return (
                    <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tighter border",
                        info.color
                    )}>
                        {info.label}
                    </span>
                );
            }
        },
        {
            header: "Presupuesto",
            accessorKey: "presupuesto_aprobado",
            sortable: true,
            cell: (v) => (
                <span className="text-xs font-mono text-gray-400">
                    ${new Intl.NumberFormat().format(v.presupuesto_aprobado || 0)}
                </span>
            )
        },
        {
            header: "Acciones",
            id: "acciones",
            className: "text-right",
            cell: (v) => (
                <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-white">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Real-time Space-age Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 border shadow-2xl transition-all duration-500 hover:shadow-blue-500/5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950"
                 style={{ borderColor: 'var(--border-color)' }}>
                {/* Glowing decorative elements */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                            <Zap size={10} /> Sistema GH Score 360 v3.0
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                            Centro de Control <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">de Talento</span>
                        </h1>
                        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                            Monitorea el estado y rendimiento de los procesos de reclutamiento de <span className="text-white font-semibold">DISCOL S.A.S.</span> en tiempo real. Utiliza asistencia de Agentes de IA para optimizar la eficiencia de selección y el cumplimiento del ANS.
                        </p>
                    </div>

                    {/* Date / Time HUD Widget */}
                    <div className="shrink-0 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center min-w-[170px] backdrop-blur-md hover:bg-white/[0.08] transition-all group">
                        <Calendar className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Fecha de Operación</span>
                        <span className="text-sm font-extrabold text-white text-center">
                            {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-blue-400/60 font-semibold mt-1 font-mono uppercase tracking-widest">Sede Central</span>
                    </div>
                </div>
            </div>

            {/* Header & Filters Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Briefcase size={22} className="text-blue-500" />
                        Análisis General
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Panel de control gerencial</p>
                </div>

                {/* PREMIUM FILTER BAR */}
                <div className="glass-panel p-4 rounded-[2rem] flex flex-col lg:flex-row lg:items-center gap-4 flex-1 w-full max-w-5xl"
                     style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2.5 px-4 py-2 border-r border-slate-200 dark:border-white/10 shrink-0">
                        <Filter size={16} className="text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Filtros</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                        {/* Periodo Select */}
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                <Calendar size={10} className="text-blue-500" /> Periodo
                            </label>
                            <select
                                value={filters.periodo}
                                onChange={(e: any) => handleFilterChange('periodo', e.target.value)}
                                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                                {periodos.map(p => (
                                    <option key={p.value} value={p.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sede Select */}
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                <MapPin size={10} className="text-blue-500" /> Sede / Ubicación
                            </label>
                            <select
                                value={filters.sede_id}
                                onChange={(e: any) => handleFilterChange('sede_id', e.target.value)}
                                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Todas las sedes</option>
                                {sedes.map(s => (
                                    <option key={s.id} value={s.id.toString()} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{s.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vacante Select */}
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                <Search size={10} className="text-blue-500" /> Vacante Específica
                            </label>
                            <select
                                value={filters.vacante_id}
                                onChange={(e: any) => handleFilterChange('vacante_id', e.target.value)}
                                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Todas las vacantes</option>
                                {vacantes.map(v => (
                                    <option key={v.id} value={v.id.toString()} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{v.puesto_nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 dark:bg-slate-900 dark:text-slate-400 rounded-xl transition-all active:scale-95 border border-slate-200 dark:border-white/10 hover:border-rose-500/20 flex items-center justify-center gap-2 shrink-0 text-[10px] font-black uppercase tracking-wider h-[38px] mt-auto"
                        title="Limpiar Filtros"
                    >
                        <RotateCcw size={12} />
                        <span>Limpiar</span>
                    </button>
                </div>
            </div>

            {/* KPI Section — Rediseño Premium con Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                <KpiCard
                    title="Vacantes Activas"
                    value={stats?.openCount || 0}
                    icon={<Briefcase size={20} />}
                    color="blue"
                    trend="+3 nuevas esta semana"
                    description="Total de posiciones que requieren contratación actualmente."
                />
                <KpiCard
                    title="Lead Time"
                    value={`${stats?.avgLeadTime || 0} días`}
                    icon={<Timer size={20} />}
                    color="cyan"
                    trend="Optimización del 5%"
                    description="Tiempo promedio desde que se abre la vacante hasta que se cubre."
                />
                <KpiCard
                    title="Eficacia"
                    value={`${stats?.efficiency || 0}%`}
                    icon={<Target size={20} />}
                    color="green"
                    trend="95% cumplimiento meta"
                    description="Porcentaje de vacantes cerradas dentro del tiempo estimado (SLA)."
                />
                <KpiCard
                    title="Vencidas"
                    value={stats?.expiredCount || 0}
                    icon={<AlertCircle size={20} />}
                    color="red"
                    trend="Requiere atención inmediata"
                    isAlert={Boolean(stats?.expiredCount && stats.expiredCount > 0)}
                    description="Vacantes que han superado su fecha límite de contratación."
                />

                {/* IA Agents Status Monitor rediseñado */}
                <div className="relative group overflow-hidden rounded-[2rem] border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/80"
                     style={{ borderColor: 'var(--border-color)' }}>
                    {/* Glowing mesh overlay */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-[#055098] to-cyan-500 rounded-l-2xl" />

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">IA Agents</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 group-hover:scale-115 transition-transform relative">
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <Zap size={18} className="text-blue-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Analytic Agent */}
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Analytic Agent</span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>ACTIVE
                                </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden bg-slate-950/50">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                        </div>

                        {/* Sourcing Agent */}
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Sourcing Agent</span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>SCANNING
                                </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden bg-slate-950/50">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: '75%', animation: 'shimmer 2.5s linear infinite' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Smart Insights Section Rediseñada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(stats as any)?.expiredCount > 0 && (
                    <div className="p-6 rounded-[2rem] flex items-start gap-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group" 
                         style={{ 
                             backgroundColor: 'var(--bg-card)', 
                             borderColor: 'rgba(239, 68, 68, 0.3)' 
                         }}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 shrink-0">
                            <AlertCircle size={22} className="animate-pulse" />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <div className="flex items-center gap-2">
                                <h4 className="font-black uppercase text-[10px] tracking-widest text-red-500">Alerta SLA</h4>
                                <span className="text-[8px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">Crítico</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Hay <span className="text-red-500 font-extrabold font-mono">{(stats as any).expiredCount} vacantes</span> que superaron el SLA de cobertura.
                                El costo de oportunidad actual suma <span className="text-red-500 font-extrabold font-mono">${new Intl.NumberFormat().format((stats as any).totalFinancialImpact)}</span>.
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="p-6 rounded-[2rem] flex items-start gap-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group" 
                     style={{ 
                         backgroundColor: 'var(--bg-card)', 
                         borderColor: 'rgba(59, 130, 246, 0.3)' 
                     }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500 shrink-0">
                        <Lightbulb size={22} />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-blue-500">Insight de Gestión</h4>
                            <span className="text-[8px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">Optimización</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            El tiempo promedio de cierre es de <span className="text-blue-500 font-bold font-mono">{stats?.avgLeadTime} días</span>.
                            Una reducción del 10% en el Lead Time ahorraría aproximadamente <span className="text-emerald-600 font-bold font-mono">$4.2M</span> mensuales.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] flex items-start gap-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group" 
                     style={{ 
                         backgroundColor: 'var(--bg-card)', 
                         borderColor: 'rgba(99, 102, 241, 0.3)' 
                     }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-500 shrink-0">
                        <Zap size={22} />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-indigo-500">Recomendación</h4>
                            <span className="text-[8px] font-bold bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-widest">Estratégico</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            La sede <span className="text-indigo-500 font-bold font-mono">{(stats as any)?.geoDistribution?.[0]?.sede || 'Principal'}</span> concentra el mayor volumen.
                            Considera priorizar recursos de apoyo para esta ubicación temporalmente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts & Early Warning Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SLA Warnings widget */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col">
                    <div className="glass-panel hud-corners border-amber-500/20 bg-gradient-to-br from-amber-500/[0.02] to-transparent p-6 rounded-[2.5rem] flex flex-col h-full">
                        <div className="corner-bl" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                                <AlertCircle size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Alerta de SLA Críticas</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Vacantes a vencer o vencidas</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            {vacantes
                                .filter(v => v.estado !== 'Cubierta')
                                .map(v => {
                                    const now = new Date();
                                    const estim = new Date(v.fecha_cierre_estimada);
                                    const diffDays = Math.ceil((estim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    return { ...v, diffDays };
                                })
                                .sort((a, b) => a.diffDays - b.diffDays)
                                .slice(0, 4)
                                .map(v => (
                                    <div key={v.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-xs font-bold text-white truncate uppercase tracking-tight group-hover:text-blue-400 transition-colors">{v.puesto_nombre}</p>
                                            <p className="text-[9px] text-slate-500 mt-0.5 uppercase font-semibold font-mono tracking-widest">{v.sede_nombre}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/20 shrink-0",
                                            v.diffDays < 0 ? "bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse" :
                                            v.diffDays <= 3 ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                                        )}>
                                            {v.diffDays < 0 ? `+${Math.abs(v.diffDays)}d Vencida` : `${v.diffDays}d Restan`}
                                        </div>
                                    </div>
                                ))}
                            {vacantes.length === 0 && (
                                <div className="h-full flex items-center justify-center flex-col py-8 text-slate-500">
                                    <p className="text-[10px] text-gray-500 italic uppercase font-bold tracking-widest">Sin vacantes críticas en proceso</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="lg:col-span-12 xl:col-span-8 glass-panel hud-corners p-6 rounded-[2.5rem] bg-gradient-to-br from-slate-900/50 to-transparent">
                    <div className="corner-bl" />
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Distribución Geográfica</h3>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Vacantes activas por sede</p>
                        </div>
                        <button className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-xl"><MoreHorizontal size={18} /></button>
                    </div>
                    <div className="h-72">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                onClick: (event, elements) => {
                                    if (elements.length > 0) {
                                        const index = elements[0].index;
                                        const sedeName = barData.labels[index];
                                        const sede = sedes.find(s => s.nombre === sedeName);
                                        if (sede) {
                                            handleFilterChange('sede_id', sede.id.toString());
                                        }
                                    }
                                },
                                onHover: (event, elements) => {
                                    if (event.native && event.native.target) {
                                        (event.native.target as HTMLElement).style.cursor = elements.length ? 'pointer' : 'default';
                                    }
                                },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false } },
                                    x: { grid: { display: false }, border: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recruiter load comparison Table rediseñada */}
            <div className="glass-panel hud-corners p-6 rounded-[2.5rem]" >
                <div className="corner-bl" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Carga de Reclutamiento por Sede</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Comparativa de procesos abiertos vs asignación estratégica</p>
                    </div>
                </div>
                <div className="pb-4">
                    <DataTable 
                        data={vacantes.slice(0, 5)} 
                        columns={columns} 
                        searchPlaceholder="Buscar vacante o sede..."
                        emptyMessage="No hay vacantes registradas recientemente."
                    />
                </div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'cyan' | 'green' | 'red', trend: string, isAlert?: boolean, description?: string }> = ({ title, value, icon, color, trend, isAlert, description }) => {
    const palette = {
        blue:  { icon: 'bg-blue-500/10 border-blue-500/20 text-blue-400',   bar: 'bg-blue-500',     glow: 'hover:shadow-blue-500/5 hover:border-blue-500/30' },
        cyan:  { icon: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',   bar: 'bg-cyan-500',     glow: 'hover:shadow-cyan-500/5 hover:border-cyan-500/30' },
        green: { icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', bar: 'bg-emerald-500', glow: 'hover:shadow-emerald-500/5 hover:border-emerald-500/30' },
        red:   { icon: 'bg-red-500/10 border-red-500/20 text-red-400',     bar: 'bg-red-500',      glow: 'hover:shadow-red-500/5 hover:border-red-500/30' },
    };
    const p = palette[color];

    return (
        <div className={cn(
            "relative group overflow-hidden rounded-[2rem] border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
            p.glow,
            isAlert && "border-red-500/30 ring-2 ring-red-500/5"
        )} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            
            {/* Ambient subtle glow light */}
            <div className={cn(
                "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[45px] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity",
                color === 'blue' && 'bg-blue-500',
                color === 'cyan' && 'bg-cyan-500',
                color === 'green' && 'bg-emerald-500',
                color === 'red' && 'bg-red-500'
            )}></div>

            {/* Left accent color bar */}
            <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-2xl", p.bar)} />

            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>{title}</span>
                    {description && (
                        <div className="group/tooltip relative">
                            <HelpCircle size={10} className="opacity-30 cursor-help hover:opacity-60 transition-opacity text-slate-400" />
                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2.5 bg-slate-950 text-slate-300 text-[10px] rounded-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 leading-relaxed font-semibold">
                                {description}
                            </div>
                        </div>
                    )}
                </div>
                <div className={cn("p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110", p.icon)}>
                    {icon}
                </div>
            </div>

            <div className="relative z-10 mb-4">
                <h3 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            </div>

            {/* Micro Sparkline SVG overlay for professional analytics design */}
            <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'cyan' ? '#06b6d4' : '#3b82f6'} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'cyan' ? '#06b6d4' : '#3b82f6'} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={
                            color === 'blue' ? "M0,80 Q20,30 40,65 T70,30 T100,10 L100,100 L0,100 Z" :
                            color === 'cyan' ? "M0,20 Q25,70 50,30 T100,75 L100,100 L0,100 Z" :
                            color === 'green' ? "M0,35 Q20,25 45,45 T75,15 T100,20 L100,100 L0,100 Z" :
                            "M0,90 Q20,70 45,30 T75,85 T100,95 L100,100 L0,100 Z"
                        }
                        fill={`url(#gradient-${color})`}
                        stroke={color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'cyan' ? '#06b6d4' : '#3b82f6'}
                        strokeWidth="1.5"
                    />
                </svg>
            </div>

            <p className={cn("text-[9px] font-black uppercase tracking-wider relative z-10", isAlert ? "text-red-400" : "")} style={{ color: isAlert ? undefined : 'var(--text-muted)' }}>
                {trend}
            </p>
        </div>
    );
}

export default Dashboard;
