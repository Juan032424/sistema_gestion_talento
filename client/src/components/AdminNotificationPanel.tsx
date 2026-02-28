import React, { useEffect, useState } from 'react';
import { Bell, User, Briefcase, Zap, CheckCircle2, Search, X, Loader2 } from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    leida: boolean;
    fecha: string;
}

const AdminNotificationPanel: React.FC<{
    onClose: () => void;
    onRefreshCount: () => void;
}> = ({ onClose, onRefreshCount }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-read');
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            onRefreshCount();
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-96 bg-[#0d1117] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Centro de Alertas</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={markAllRead} className="text-[10px] font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase">Marcar leídas</button>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"><X size={16} /></button>
                </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={24} />
                        <p className="text-xs text-gray-500">Cargando alertas...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 hover:bg-white/[0.02] transition-all cursor-pointer group relative",
                                    !n.leida && "bg-blue-500/[0.03]"
                                )}
                                onClick={() => {
                                    if (n.tipo === 'nueva_postulacion') navigate('/sourcing');
                                    onClose();
                                }}
                            >
                                {!n.leida && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                                )}
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                        n.tipo === 'nueva_postulacion' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {n.tipo === 'nueva_postulacion' ? <Zap size={16} /> : <Bell size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className={cn("text-xs font-black truncate", !n.leida ? "text-white" : "text-gray-400")}>{n.titulo}</h4>
                                            <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">{formatTime(n.fecha)}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{n.mensaje}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white/[0.01]">
                        <div className="w-16 h-16 bg-[#161b22] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="text-gray-700" size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-400">Todo al día</h4>
                        <p className="text-xs text-gray-600 mt-1">No tienes nuevas alertas por ahora.</p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-white/5 text-center bg-white/[0.02]">
                <button
                    onClick={() => { navigate('/sourcing'); onClose(); }}
                    className="text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest"
                >
                    Ver historial completo
                </button>
            </div>
        </div>
    );
};

export default AdminNotificationPanel;
