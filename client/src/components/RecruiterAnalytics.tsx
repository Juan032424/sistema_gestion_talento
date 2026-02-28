import React, { useEffect, useState } from 'react';
import {
    TrendingDown,
    AlertCircle,
    Zap,
    Clock,
    DollarSign,
    Users,
    Activity
} from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';
import HotVacanciesDashboard from './HotVacanciesDashboard';

interface Bottleneck {
    etapa_nombre: string;
    avg_days_in_stage: number;
}

const RecruiterAnalytics: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, bottleRes, rankingRes] = await Promise.all([
                api.get('/vacantes/stats'),
                api.get('/candidatos/analytics/bottlenecks'),
                api.get('/analytics/ranking')
            ]);
            setStats(statsRes.data);
            setBottlenecks(bottleRes.data);
            setRanking(rankingRes.data);
        } catch (error) {
            console.error("Error fetching analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm font-medium animate-pulse">Cargando analíticas estratégicas...</p>
            </div>
        </div>
    );

    if (!stats) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
                <AlertCircle className="mx-auto text-red-500" size={48} />
                <h3 className="text-xl font-bold text-white">Error al cargar datos</h3>
                <p className="text-gray-500">No se pudo obtener la información de analíticas. Revisa la conexión con el servidor.</p>
                <button onClick={() => fetchData()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Reintentar</button>
            </div>
        </div>
    );

    // Algorithm for IPR (Indice de Productividad del Reclutador)
    const calculateIPR = (rec: any) => {
        // rec format from view: Reclutador, Vacantes_Gestionadas, Cerradas_Exito, Dias_Promedio_Cierre, Incumplimientos_SLA, Satisfaccion_Jefes
        const successRate = rec.Vacantes_Gestionadas > 0 ? (rec.Cerradas_Exito / rec.Vacantes_Gestionadas) * 100 : 0;
        const slaRate = rec.Vacantes_Gestionadas > 0 ? ((rec.Vacantes_Gestionadas - rec.Incumplimientos_SLA) / rec.Vacantes_Gestionadas) * 100 : 0;
        const satisfaction = (rec.Satisfaccion_Jefes || 4) * 20; // Scale 1-5 to 0-100

        return Math.round((successRate * 0.4) + (slaRate * 0.3) + (satisfaction * 0.3));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Impacto Financiero Total"
                    value={`$${new Intl.NumberFormat().format(stats.totalFinancialImpact || 0)}`}
                    subtitle="Pérdida por vacantes críticas"
                    icon={<DollarSign className="text-red-400" />}
                    trend="alert"
                />
                <MetricCard
                    title="Time-to-Fill Promedio"
                    value={`${stats.avgLeadTime} días`}
                    subtitle="Desde apertura a cubrimiento"
                    icon={<Clock className="text-blue-400" />}
                    trend="neutral"
                />
                <MetricCard
                    title="Eficiencia de Cierre"
                    value={`${stats.efficiency}%`}
                    subtitle="Cumplimiento de fechas"
                    icon={<Zap className="text-amber-400" />}
                    trend="success"
                />
                <MetricCard
                    title="Workload Promedio"
                    value={(stats.openCount / (stats.recruiterWorkload?.length || 1)).toFixed(1)}
                    subtitle="Vacantes por reclutador"
                    icon={<Activity className="text-indigo-400" />}
                    trend="neutral"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RECRUITER COMPARISON (IPR) */}
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={20} className="text-blue-500" />
                                Eficiencia del Equipo de Selección
                            </h3>
                            <p className="text-xs text-gray-500">IPR (Índice de Productividad del Reclutador)</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
                            <TrendingDown size={12} /> Algoritmo V1.2
                        </div>
                    </div>

                    <div className="space-y-6">
                        {ranking.map((rec: any, idx: number) => (
                            <div key={idx} className="space-y-2 group cursor-pointer">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-blue-500">
                                            {rec.Reclutador?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{rec.Reclutador}</div>
                                            <div className="text-[10px] text-gray-500">
                                                {rec.Vacantes_Gestionadas} vacantes • {rec.Dias_Promedio_Cierre}d prom.
                                                {rec.Satisfaccion_Jefes && ` • ⭐ ${rec.Satisfaccion_Jefes}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-white">{calculateIPR(rec)}%</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">IPR Global</div>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000 ease-out",
                                            calculateIPR(rec) > 80 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                                                calculateIPR(rec) > 60 ? "bg-blue-500" : "bg-amber-500"
                                        )}
                                        style={{ width: `${calculateIPR(rec)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {ranking.length === 0 && <p className="text-gray-500 text-sm italic">No hay datos de gestión para procesar el ranking.</p>}
                    </div>

                    <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Explicación del Algoritmo</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">
                            El **IPR** cuantifica el rendimiento mediante la formula:
                            <span className="text-blue-400 ml-1 font-mono">IPR = (Eficiencia_Cierre × 0.4) + (Ratio_Cumplimiento × 0.3) + (Balance_Carga × 0.3)</span>.
                            Permite identificar reclutadores con mayor agilidad en el cierre de posiciones críticas.
                        </p>
                    </div>
                </div>

                {/* BOTTLENECK ANALYSIS */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <AlertCircle size={20} className="text-amber-500" />
                        Cuellos de Botella
                    </h3>

                    <div className="space-y-4">
                        {bottlenecks.map((bt, idx) => (
                            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-white">{bt.etapa_nombre}</div>
                                    <div className="text-[10px] text-gray-500">Tiempo de espera promedio</div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "text-sm font-black",
                                        bt.avg_days_in_stage > 5 ? "text-red-400" : "text-amber-400"
                                    )}>
                                        {Number(bt.avg_days_in_stage).toFixed(1)} días
                                    </div>
                                    <div className="text-[9px] text-gray-600 uppercase">Avg. Cycle</div>
                                </div>
                            </div>
                        ))}
                        {bottlenecks.length === 0 && (
                            <div className="py-12 text-center">
                                <Clock className="mx-auto text-gray-700 mb-2" size={32} />
                                <p className="text-xs text-gray-600 ">No hay datos suficientes para análisis de ciclos.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Insight Gerencial</h4>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-[11px] text-amber-500/80 leading-tight">
                                ⚠️ Se detecta demora mayor a 5 días en la etapa de <strong>Entrevistas Técnicas</strong>.
                                Posible falta de disponibilidad de los líderes de área.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN NUEVA: ANALISIS DE TRACCIÓN (HOT VACANCIES) */}
                <div className="glass-card p-6">
                    <HotVacanciesDashboard />
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ title: string, value: string, subtitle: string, icon: React.ReactNode, trend: 'success' | 'alert' | 'neutral' }> = ({ title, value, subtitle, icon, trend }) => (
    <div className="glass-card p-6 group hover:border-white/20 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <h3 className="text-2xl font-black text-white mb-1">{value}</h3>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 italic">{subtitle}</span>
            <div className={cn(
                "w-2 h-2 rounded-full",
                trend === 'success' ? "bg-green-500" : trend === 'alert' ? "bg-red-500 animate-pulse" : "bg-blue-500"
            )} />
        </div>
    </div>
);

export default RecruiterAnalytics;
