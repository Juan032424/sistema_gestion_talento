import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import type { Vacante } from '../types';
import {
    User,
    MapPin,
    Clock,
    CheckCircle2,
    Circle,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/Skeleton';

const Kanban: React.FC = () => {
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/vacantes').then(res => {
            setVacantes(res.data);
            setLoading(false);
        }).catch(err => {
            console.error('Error loading vacantes:', err);
            setLoading(false);
        });
    }, []);

    const columns = [
        { title: 'Por Abrir / Abierta', status: 'Abierta', color: '#3b82f6', bg: 'bg-blue-500/10' },
        { title: 'En Proceso Selección', status: 'En Proceso', color: '#8b5cf6', bg: 'bg-purple-500/10' },
        { title: 'Cerrada / Cubierta', status: 'Cubierta', color: '#10b981', bg: 'bg-green-500/10' }
    ];

    if (loading) return (
        <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
            <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar px-2">
                {columns.map(col => (
                    <div key={col.status} className="flex-1 min-w-[340px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-5 px-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="kanban-card p-6 rounded-xl bg-[#0d1117] border border-white/10">
                                    <Skeleton className="h-3 w-16 mb-2" />
                                    <Skeleton className="h-6 w-3/4 mb-4" />
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-4 w-40 mb-4" />
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <Skeleton className="h-7 w-24 rounded-full" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const handleMove = async (e: React.MouseEvent, vacante: Vacante, direction: 'next' | 'prev') => {
        e.preventDefault();
        e.stopPropagation();

        const currentIndex = columns.findIndex(c => c.status === vacante.estado);
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < columns.length) {
            const newStatus = columns[newIndex].status;

            // Optimistic update
            const updatedVacantes = vacantes.map(v =>
                v.id === vacante.id ? { ...v, estado: newStatus } : v
            );
            setVacantes(updatedVacantes); // Immediate UI feedback

            try {
                // Assuming backend accepts partial updates nicely
                await api.put(`/vacantes/${vacante.id}`, { ...vacante, estado: newStatus });
            } catch (error) {
                console.error("Error moving card", error);
                // Revert on error
                setVacantes(vacantes);
                alert("Error al mover la vacante. Intente nuevamente.");
            }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="text-[#3a94cc]" />
                    Tablero de Gestión
                </h2>
                <div className="flex gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50"></span> Abierta</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/50"></span> En Proceso</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></span> Cerrada</span>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar px-2 snap-x">
                {columns.map((col, colIndex) => (
                    <div key={col.status} className="flex-1 min-w-[340px] flex flex-col h-full group snap-center">
                        <div className="flex items-center justify-between mb-5 px-2">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", col.status === 'Abierta' ? "bg-blue-500 text-blue-500" : col.status === 'Cubierta' ? "bg-green-500 text-green-500" : "bg-purple-500 text-purple-500")} />
                                <h3 className="font-bold text-sm tracking-tight text-white uppercase">{col.title}</h3>
                            </div>
                            <span className="bg-[#161b22] text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-white/5 shadow-inner">
                                {vacantes.filter(v => v.estado === col.status).length}
                            </span>
                        </div>

                        <div className={cn("flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar p-3 rounded-2xl transition-all duration-300 border backdrop-blur-sm", "bg-white/[0.02] border-white/5 group-hover:bg-white/[0.03] group-hover:border-white/10")}>
                            {vacantes.filter(v => v.estado === col.status).map(v => (
                                <div
                                    key={v.id}
                                    className="kanban-card group/card relative block hover:ring-1 hover:ring-[#3a94cc]/50 transition-all cursor-default overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
                                >
                                    {/* Quick Actions Overlay (Visible on Hover) */}
                                    <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">

                                        {colIndex > 0 && (
                                            <button
                                                onClick={(e) => handleMove(e, v, 'prev')}
                                                className="p-1.5 rounded-lg bg-[#0d1117]/80 text-gray-400 hover:text-white hover:bg-[#3a94cc] border border-white/10 shadow-lg backdrop-blur"
                                                title="Mover a etapa anterior"
                                            >
                                                <MoreHorizontal size={14} className="rotate-180" /> {/* Using rotate for back arrow simulation if specific icon unavailable */}
                                            </button>
                                        )}
                                        {colIndex < columns.length - 1 && (
                                            <button
                                                onClick={(e) => handleMove(e, v, 'next')}
                                                className="p-1.5 rounded-lg bg-[#0d1117]/80 text-gray-400 hover:text-white hover:bg-[#3a94cc] border border-white/10 shadow-lg backdrop-blur"
                                                title="Avanzar etapa"
                                            >
                                                <MoreHorizontal size={14} />
                                            </button>
                                        )}
                                        <Link to={`/edit-vacante/${v.id}`} className="p-1.5 rounded-lg bg-[#0d1117]/80 text-gray-400 hover:text-white hover:bg-[#3a94cc] border border-white/10 shadow-lg backdrop-blur" title="Editar detalles">
                                            <Circle size={14} />
                                        </Link>
                                    </div>

                                    <div className="flex justify-between items-start mb-4 pr-16 relative">
                                        <div className="flex flex-col gap-1">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5",
                                                v.prioridad === 'Crítica' ? "text-red-500" :
                                                    v.prioridad === 'Alta' ? "text-amber-500" : "text-gray-500"
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", v.prioridad === 'Crítica' ? "bg-red-500 animate-pulse" : "bg-gray-600")}></span>
                                                {v.prioridad} Priority
                                            </span>
                                            <h4 className="font-bold text-white text-md leading-snug group-hover/card:text-[#3a94cc] transition-colors capitalize">
                                                {v.puesto_nombre}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-500 text-[11px] font-medium">
                                            <MapPin size={14} className="text-gray-600" />
                                            <span>{v.sede_nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-[11px] font-medium">
                                            <Clock size={14} className="text-gray-600" />
                                            <span className={cn(new Date(v.fecha_cierre_estimada) < new Date() && "text-red-400 font-bold")}>
                                                Expira: {new Date(v.fecha_cierre_estimada).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 ring-1 ring-white/5">
                                                <User size={12} className="text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 truncate max-w-[80px]">{v.responsable_rh}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                                            {v.estado === 'Cubierta' ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                            <span className="text-[9px] font-bold uppercase text-gray-400">{v.codigo_requisicion}</span>
                                        </div>
                                    </div>

                                    {/* Hover gradient effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover/card:animate-shimmer pointer-events-none" />
                                </div>
                            ))}

                            {vacantes.filter(v => v.estado === col.status).length === 0 && (
                                <div className="border-2 border-dashed border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 hover:border-white/20 transition-all cursor-pointer group/empty">
                                    <div className="w-12 h-12 rounded-full bg-white/5 mb-3 flex items-center justify-center group-hover/empty:scale-110 transition-transform">
                                        <Plus className="text-gray-500 group-hover/empty:text-white" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover/empty:text-gray-300">Crear Vacante</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Import Layers and Plus icons that were missing
import { Layers, Plus } from 'lucide-react';

export default Kanban;
