import React, { useState, useEffect } from 'react';
import { Flame, Eye, Users, MousePointer2, Star, TrendingUp } from 'lucide-react';
import api from '../api';

interface HotVacancy {
    id: number;
    puesto_nombre: string;
    codigo_requisicion: string;
    responsable_rh: string;
    total_views: number;
    applications_count: number;
    unique_candidate_views: number;
    saves_count: number;
    intent_to_apply_count: number;
}

const HotVacanciesDashboard: React.FC = () => {
    const [vacancies, setVacancies] = useState<HotVacancy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotVacancies = async () => {
            try {
                const res = await api.get('/analytics/hot-vacancies');
                setVacancies(res.data);
            } catch (error) {
                console.error("Error fetching hot vacancies", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotVacancies();
    }, []);

    if (loading) return <div className="text-gray-500 text-xs animate-pulse p-4">Analizando tracción de vacantes...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Flame size={14} className="text-orange-500 animate-pulse" />
                    Vacantes "Hot" (Mayor Engagement)
                </h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Top 10 - Basado en IA</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vacancies.map((v, idx) => (
                    <div key={v.id} className="group relative bg-slate-900/40 border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all hover:bg-slate-900/60 overflow-hidden">
                        {/* Heat Gradient Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">Rank #{idx + 1}</span>
                                    <span className="text-[9px] text-gray-500 font-mono">{v.codigo_requisicion}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                                    {v.puesto_nombre}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                    <Users size={10} />
                                    {v.responsable_rh}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-1 justify-end text-orange-400">
                                    <TrendingUp size={12} />
                                    <span className="text-xs font-black">
                                        {Math.round((v.unique_candidate_views / (v.total_views || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">Conv. Rate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center">
                                <p className="text-[9px] text-gray-500 font-bold mb-0.5">Vistas</p>
                                <div className="flex items-center justify-center gap-1 text-white font-mono text-xs">
                                    <Eye size={10} className="text-blue-400" />
                                    {v.total_views}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-gray-500 font-bold mb-0.5">Únicos</p>
                                <div className="flex items-center justify-center gap-1 text-white font-mono text-xs">
                                    <Users size={10} className="text-indigo-400" />
                                    {v.unique_candidate_views}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-gray-500 font-bold mb-0.5">Saves</p>
                                <div className="flex items-center justify-center gap-1 text-white font-mono text-xs">
                                    <Star size={10} className="text-yellow-400" />
                                    {v.saves_count}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-gray-500 font-bold mb-0.5">Intents</p>
                                <div className="flex items-center justify-center gap-1 text-white font-mono text-xs">
                                    <MousePointer2 size={10} className="text-emerald-400" />
                                    {v.intent_to_apply_count}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {vacancies.length === 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-sm italic">
                    No hay suficientes datos para generar el ranking de engagement térmico.
                </div>
            )}
        </div>
    );
};

export default HotVacanciesDashboard;
