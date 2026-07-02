import React, { useState, useEffect } from 'react';
import { Clock, User, ArrowRight, ShieldCheck, Mail, Database, AlertCircle } from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface AuditLog {
    id: number;
    user_email: string;
    action: string;
    changes: any;
    created_at: string;
    entity_name: string;
}

interface AuditTimelineProps {
    entityId: number | string;
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ entityId }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await api.get(`/candidatos/${entityId}/audit`);
                setLogs(res.data);
            } catch (error) {
                console.error("Error fetching audit logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, [entityId]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'UPDATE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'EMAIL_SENT': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <Database size={14} />;
            case 'UPDATE': return <ArrowRight size={14} />;
            case 'DELETE': return <AlertCircle size={14} />;
            case 'EMAIL_SENT': return <Mail size={14} />;
            default: return <Clock size={14} />;
        }
    };

    if (loading) return (
        <div className="space-y-4 p-4 text-center">
            <Clock className="mx-auto text-slate-700 animate-spin" size={24} />
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Cargando trazabilidad corporativa...</p>
        </div>
    );

    if (logs.length === 0) return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center italic text-slate-600 text-sm">
            No hay registros de auditoría recientes para este candidato.
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent" />

                <div className="space-y-8">
                    {logs.map((log, index) => (
                        <motion.div 
                            key={log.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative flex gap-6 group"
                        >
                            {/* Icon Circle */}
                            <div className={cn(
                                "z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-2xl transition-all group-hover:scale-110",
                                log.action === 'CREATE' ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400" :
                                log.action === 'UPDATE' ? "bg-amber-950/80 border-amber-500/30 text-amber-400" :
                                log.action === 'EMAIL_SENT' ? "bg-blue-950/80 border-blue-500/30 text-blue-400" :
                                "bg-slate-950/80 border-slate-700/50 text-slate-400"
                            )}>
                                {getIcon(log.action)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-3xl p-5 hover:bg-slate-900/60 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border", getActionBadge(log.action))}>
                                            {log.action}
                                        </span>
                                        <span className="text-xs font-black text-indigo-400 italic">
                                            {log.entity_name === 'candidatos' ? 'Portal Público' : 'Adm. Talento'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                        <Clock size={10} />
                                        {formatTime(log.created_at)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                        <User size={12} className="text-slate-400" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-300">{log.user_email || 'Sistema Automático'}</span>
                                </div>

                                {log.changes && (
                                    <div className="space-y-1 bg-black/20 rounded-2xl p-4 border border-white/5">
                                        {typeof log.changes === 'object' ? (
                                            Object.entries(log.changes || {}).map(([key, value], i) => (
                                                <div key={i} className="flex flex-wrap items-center gap-x-2 text-[10px] font-mono leading-relaxed">
                                                    <span className="text-slate-500 uppercase font-bold">{key}:</span>
                                                    <span className="text-slate-100 truncate max-w-full italic">{String(value)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-slate-300 italic">{String(log.changes)}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <ShieldCheck size={18} className="text-indigo-400" />
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                    Este registro de auditoría es inalterable y cumple con los estándares de seguridad RGPD / ISO 27001.
                </p>
            </div>
        </div>
    );
};

export default AuditTimeline;
