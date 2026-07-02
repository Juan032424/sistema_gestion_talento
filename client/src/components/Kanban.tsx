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
    MoreHorizontal,
    Layers,
    Plus,
    Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ToastNotification';

const Kanban: React.FC = () => {
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        api.get('/vacantes').then(res => {
            const vData = res.data;
            setVacantes(Array.isArray(vData) ? vData : (vData?.data || []));
            setLoading(false);
        }).catch(err => {
            console.error('Error loading vacantes:', err);
            setLoading(false);
        });
    }, []);

    const columns = [
        { title: 'Por Abrir / Abierta', status: 'Abierta', color: '#055098', bg: 'bg-[#055098]/10', border: 'border-[#055098]/30', glow: 'shadow-[#055098]/30' },
        { title: 'En Proceso Selección', status: 'En Proceso', color: '#00d4ff', bg: 'bg-[#00d4ff]/10', border: 'border-[#00d4ff]/30', glow: 'shadow-[#00d4ff]/30' },
        { title: 'Cerrada / Cubierta', status: 'Cubierta', color: '#10b981', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/30', glow: 'shadow-[#10b981]/30' }
    ];

    if (loading) return (
        <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
            <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar px-2">
                {columns.map(col => (
                    <div key={col.status} className="flex-1 min-w-[340px] flex flex-col h-full">
                        <div className="flex items-center justify-between mb-5 px-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="flex-1 space-y-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-40 w-full rounded-xl" />
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

            // Optimistic update for holographic fluid motion
            const updatedVacantes = vacantes.map(v =>
                v.id === vacante.id ? { ...v, estado: newStatus as any } : v
            );
            setVacantes(updatedVacantes); // The <motion.div layout> handles the flying animation!

            try {
                await api.put(`/vacantes/${vacante.id}`, { ...vacante, estado: newStatus });
            } catch (error) {
                console.error("Error moving card", error);
                // Revert on error
                setVacantes(vacantes);
                showToast("Fallo en sincronización. Intentando reconectar...", "error");
            }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-150px)] overflow-hidden animate-in fade-in duration-700">
            {/* HUD HEADER */}
            <div className="flex justify-between items-end mb-6 px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" style={{ color: 'var(--text-primary)' }}>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Layers className="text-blue-500" size={24} />
                        </div>
                        Sistema Integrado Kanban
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] mt-2 hidden sm:flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <Activity size={12} className="text-emerald-500 animate-pulse" /> Estado del núcleo: Sincronizado
                    </p>
                </div>

                {/* Status Legend */}
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 shadow-2xl hidden md:flex">
                    {columns.map(col => (
                        <span key={col.title} className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: col.color, boxShadow: `0 0 10px ${col.color}` }}></span>
                            {col.status}
                        </span>
                    ))}
                </div>
            </div>

            {/* HOLOGRAPHIC BOARD */}
            <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar px-2 snap-x">
                {columns.map((col, colIndex) => (
                    <div key={col.status} className="flex-1 min-w-[350px] flex flex-col h-full group snap-center">
                        
                        {/* COLUMN HEADER */}
                        <div className="flex items-center justify-between mb-5 px-3">
                            <div className="flex items-center gap-3 relative">
                                {/* Glowing Pulse Indicator */}
                                <div className="relative flex items-center justify-center w-5 h-5">
                                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: col.color }} />
                                    <div className="relative w-2.5 h-2.5 rounded-full z-10" style={{ backgroundColor: col.color, boxShadow: `0 0 15px ${col.color}` }} />
                                </div>
                                <h3 className="font-black text-sm tracking-widest uppercase truncate" style={{ color: 'var(--text-primary)' }}>
                                    {col.title}
                                </h3>
                            </div>
                            
                            {/* Counter Badge */}
                            <span className="text-[11px] font-black px-3 py-1 rounded-full border shadow-inner flex items-center justify-center min-w-[32px] transition-colors"
                                  style={{ backgroundColor: col.bg, color: col.color, borderColor: col.color }}>
                                {vacantes.filter(v => v.estado === col.status).length}
                            </span>
                        </div>

                        {/* COLUMN BODY (Glassmorphism container) */}
                        <div className="flex-1 space-y-4 overflow-y-auto pr-3 custom-scrollbar p-3 rounded-2xl transition-all duration-500 border relative backdrop-blur-md glass-panel"
                             style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
                            
                            {/* Ambient column glow */}
                            <div className="absolute inset-0 opacity-[0.03] transition-opacity duration-500 rounded-2xl group-hover:opacity-[0.08] pointer-events-none" 
                                 style={{ background: `linear-gradient(to bottom, ${col.color}, transparent)` }} />

                            <AnimatePresence>
                                {vacantes.filter(v => v.estado === col.status).map(v => (
                                    <motion.div
                                        layout
                                        layoutId={v.id.toString()}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        key={v.id}
                                        className="group/card relative block p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
                                        style={{ 
                                            backgroundColor: 'var(--bg-card)', 
                                            borderColor: 'var(--border-color)'
                                        }}
                                    >
                                        {/* Holographic left accent bar */}
                                        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl opacity-70 group-hover/card:opacity-100 transition-all duration-300"
                                             style={{ backgroundColor: col.color }} />

                                        {/* Quick Actions Overlay (Appears on Hover) */}
                                        <div className="absolute top-2.5 right-2.5 flex gap-1 z-20 opacity-0 transform translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-300">
                                            {colIndex > 0 && (
                                                <button onClick={(e) => handleMove(e, v, 'prev')}
                                                    className="p-1 rounded-lg bg-slate-900/85 text-gray-400 hover:text-white hover:bg-blue-600 border border-white/10 shadow-lg backdrop-blur"
                                                    title="Mover atrás">
                                                    <MoreHorizontal size={12} className="rotate-180" />
                                                </button>
                                            )}
                                            {colIndex < columns.length - 1 && (
                                                <button onClick={(e) => handleMove(e, v, 'next')}
                                                    className="p-1 rounded-lg bg-slate-900/85 text-gray-400 hover:text-white hover:bg-blue-600 border border-white/10 shadow-lg backdrop-blur"
                                                    title="Avanzar etapa">
                                                    <MoreHorizontal size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Upper Section: Title and Priority Dot */}
                                        <div className="flex items-start justify-between gap-3 mb-1.5 relative z-10">
                                            <h4 className="font-extrabold text-sm leading-tight group-hover/card:text-blue-500 transition-colors capitalize tracking-tight flex-1 pr-6" style={{ color: 'var(--text-primary)' }}>
                                                {v.puesto_nombre}
                                            </h4>
                                            <span className={cn(
                                                "w-2 h-2 rounded-full shrink-0 mt-1",
                                                v.prioridad === 'Crítica' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" :
                                                v.prioridad === 'Alta' ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                                            )} title={`${v.prioridad} Prioridad`} />
                                        </div>

                                        {/* Sub-Header: Requisition Code and Location */}
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-3.5 relative z-10 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} className="text-slate-400" />
                                                {v.sede_nombre}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-400/25" />
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} className={cn(new Date(v.fecha_cierre_estimada) < new Date() ? "text-red-500" : "text-slate-400")} />
                                                <span className={cn(new Date(v.fecha_cierre_estimada) < new Date() && "text-red-500 font-extrabold")}>
                                                    T-Minus: {new Date(v.fecha_cierre_estimada).toLocaleDateString()}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Bottom Footer: User and Badge */}
                                        <div className="flex items-center justify-between pt-3 border-t relative z-10" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center gap-1.5 group/user flex-1 min-w-0 pr-2">
                                                <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 flex items-center justify-center border ring-2 ring-blue-500/5 group-hover/user:ring-blue-500/20 transition-all overflow-hidden" style={{ borderColor: col.color }}>
                                                    {v.responsable_avatar ? (
                                                        <img src={`http://localhost:3001${v.responsable_avatar}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={10} style={{ color: col.color }} />
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-bold truncate max-w-[110px]" style={{ color: 'var(--text-secondary)' }}>
                                                    {v.responsable_rh}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border shadow-sm transition-colors text-[9px] font-black" style={{ backgroundColor: col.bg, borderColor: col.color, color: col.color }}>
                                                {v.estado === 'Cubierta' ? <CheckCircle2 size={10} className="text-green-500" /> : <span className="w-1 h-1 rounded-full bg-current shrink-0" />}
                                                <span className="tracking-widest">
                                                    {v.codigo_requisicion}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover/card:animate-shimmer pointer-events-none z-0" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {vacantes.filter(v => v.estado === col.status).length === 0 && (
                                <div className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center opacity-30 hover:opacity-100 transition-all cursor-pointer group/empty" 
                                     style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="w-10 h-10 rounded-full bg-white/5 mb-3 flex items-center justify-center group-hover/empty:scale-110 group-hover/empty:-rotate-90 transition-all">
                                        <Plus size={20} className="text-gray-500 group-hover/empty:text-white" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Zona Despejada</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Kanban;
