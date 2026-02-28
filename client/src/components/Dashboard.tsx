import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api';
import type { Stats, Vacante } from '../types';
import {
    Timer,
    Target,
    AlertCircle,
    TrendingUp,
    MoreHorizontal,
    Briefcase,
    Zap,
    DollarSign,
    Lightbulb,
    HelpCircle,
    Bot
} from 'lucide-react';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, vacantesRes] = await Promise.all([
                api.get('/vacantes/stats'),
                api.get('/vacantes')
            ]);
            setStats(statsRes.data);
            setVacantes(vacantesRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Cargando métricas de talento...</p>
        </div>
    );

    const funnelData = {
        labels: ['Abierta', 'En Proceso', 'Cubierta'],
        datasets: [{
            data: [
                vacantes.filter(v => ['Abierta'].includes(v.estado)).length,
                vacantes.filter(v => v.estado === 'En Proceso').length,
                vacantes.filter(v => v.estado === 'Cubierta').length,
            ],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)'
            ],
            hoverOffset: 15,
            borderWidth: 0,
        }]
    };

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

    // Calculate SLA Status for priority table
    const getSlaInfo = (v: Vacante) => {
        const now = new Date();
        const estim = new Date(v.fecha_cierre_estimada);
        const diffDays = Math.ceil((estim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (v.estado === 'Cubierta') return { label: 'Completado', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
        if (diffDays < 0) return { label: `Vencido (${Math.abs(diffDays)}d)`, color: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' };
        if (diffDays <= 3) return { label: `Urgente (${diffDays}d)`, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        return { label: `${diffDays} días restantes`, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    };

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Análisis de Reclutamiento</h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Estado de la gestión humana al {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full border border-blue-500/20">
                    <TrendingUp size={16} />
                    <span>+12% vs mes anterior</span>
                </div>
            </div>

            {/* KPI Section with Friendly Tooltips (Using group-hover) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards">
                <KpiCard
                    title="Vacantes Activas"
                    value={stats?.openCount || 0}
                    icon={<Briefcase size={22} />}
                    color="blue"
                    trend="+3 nuevas esta semana"
                    description="Total de posiciones que requieren contratación actualmente."
                />
                <KpiCard
                    title="Lead Time"
                    value={`${stats?.avgLeadTime || 0} días`}
                    icon={<Timer size={22} />}
                    color="purple"
                    trend="Optimización del 5%"
                    description="Tiempo promedio desde que se abre la vacante hasta que se cubre."
                />
                <KpiCard
                    title="Eficacia"
                    value={`${stats?.efficiency || 0}%`}
                    icon={<Target size={22} />}
                    color="green"
                    trend="95% cumplimiento meta"
                    description="Porcentaje de vacantes cerradas dentro del tiempo estimado (SLA)."
                />
                <KpiCard
                    title="Vencidas"
                    value={stats?.expiredCount || 0}
                    icon={<AlertCircle size={22} />}
                    color="red"
                    trend="Requiere atención inmediata"
                    isAlert={Boolean(stats?.expiredCount && stats.expiredCount > 0)}
                    description="Vacantes que han superado su fecha límite de contratación."
                />
                <div className="stat-card bg-indigo-600/5 border-indigo-500/20 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Bot size={60} />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-[#3a94cc]">IA Agents Status</span>
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Zap size={22} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">ANALYTIC AGENT</span>
                            <span className="text-emerald-400">ACTIVE</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">SOURCING AGENT</span>
                            <span className="text-blue-400">SCANNING</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '65%' }} />
                        </div>
                    </div>
                </div >
            </div >

            {/* Smart Insights Section */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
                {(stats as any)?.expiredCount > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest">Alerta de Crítica</h4>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Hay <span className="text-red-400 font-bold">{(stats as any).expiredCount} vacantes</span> que superaron el SLA.
                                El costo de oportunidad actual suma <span className="text-red-400 font-bold">${new Intl.NumberFormat().format((stats as any).totalFinancialImpact)}</span>.
                            </p>
                        </div>
                    </div>
                )}
                <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-500">
                        <Lightbulb size={24} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest">Insight de Gestión</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            El tiempo promedio de cierre actual es de <span className="text-blue-400 font-bold">{stats?.avgLeadTime} días</span>.
                            Una reducción del 10% ahorraría aprox. <span className="text-green-400 font-bold">$4.2M</span> mensuales.
                        </p>
                    </div>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-500">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest">Recomendación</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            La sede <span className="text-purple-400 font-bold">{(stats as any)?.geoDistribution?.[0]?.sede || 'Principal'}</span> concentra el mayor volumen.
                            Considerar priorizar recursos de apoyo para esta ubicación.
                        </p>
                    </div>
                </div>
            </div >

            {/* Charts Grid */}
            < div className="grid grid-cols-1 lg:grid-cols-12 gap-6" >
                <div className="lg:col-span-7 stat-card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">Distribución Geográfica</h3>
                        <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="h-80">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                                    x: { grid: { display: false }, border: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-5 stat-card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">Estado del Funnel</h3>
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase tracking-tighter">Real-time</span>
                    </div>
                    <div className="h-80 relative flex items-center justify-center">
                        <Doughnut
                            data={funnelData}
                            options={{
                                cutout: '75%',
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom', labels: { color: '#888', usePointStyle: true, padding: 25 } } }
                            }}
                        />
                        <div className="absolute flex flex-col items-center pointer-events-none mb-10">
                            <span className="text-4xl font-extrabold text-white">{vacantes.length}</span>
                            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Total</span>
                        </div>
                    </div>
                </div>
            </div >

            {/* Recent Activity / Priority Table */}
            < div className="stat-card" >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold">Carga de Reclutamiento por Sede</h3>
                        <p className="text-xs text-gray-500 mt-1">Comparativa de procesos abiertos vs asignación</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-all">
                        Ver todo el historial
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                <th className="pb-4 px-2">Sede / Ubicación</th>
                                <th className="pb-4">Responsable</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Presupuesto</th>
                                <th className="pb-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vacantes.slice(0, 5).map((v) => (
                                <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-5 px-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{v.puesto_nombre}</span>
                                            <span className="text-[11px] text-gray-500 mt-0.5">{v.sede_nombre}</span>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                                {(v.responsable_rh || 'U').substring(0, 1)}
                                            </div>
                                            <span className="text-xs text-gray-300">{v.responsable_rh}</span>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tighter border",
                                            getSlaInfo(v).color
                                        )}>
                                            {getSlaInfo(v).label}
                                        </span>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-xs font-mono text-gray-400">
                                            ${new Intl.NumberFormat().format(v.presupuesto_aprobado || 0)}
                                        </span>
                                    </td>
                                    <td className="py-5 text-right">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-white">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {vacantes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500 italic text-sm">
                                        No hay vacantes registradas recientemente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    );
};

const KpiCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'purple' | 'green' | 'red', trend: string, isAlert?: boolean, description?: string }> = ({ title, value, icon, color, trend, isAlert, description }) => {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-500",
        purple: "bg-purple-500/10 text-purple-500",
        green: "bg-green-500/10 text-green-500",
        red: "bg-red-500/10 text-red-500",
    };

    return (
        <div className={cn("stat-card flex flex-col justify-between group h-full", isAlert && "border-red-500/30 ring-4 ring-red-500/5")}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
                    {description && (
                        <div className="group/tooltip relative">
                            <HelpCircle size={12} className="text-gray-600 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-gray-300 text-[10px] rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10">
                                {description}
                            </div>
                        </div>
                    )}
                </div>
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colorClasses[color])}>
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-white">{value}</h3>
                <p className={cn("text-[10px] mt-2 font-semibold", isAlert ? "text-red-400" : "text-gray-500 uppercase tracking-tighter")}>{trend}</p>
            </div>
        </div>
    );
}

export default Dashboard;
