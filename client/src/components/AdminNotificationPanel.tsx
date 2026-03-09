import React, { useEffect, useState } from 'react';
import { Bell, User, Zap, CheckCircle2, X, Loader2, Phone, Mail, MapPin, GraduationCap, Briefcase, FileText } from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    metadata?: string;
    leida: boolean;
    fecha: string;
}

const AdminNotificationPanel: React.FC<{
    onClose: () => void;
    onRefreshCount: () => void;
}> = ({ onClose, onRefreshCount }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPreview, setSelectedPreview] = useState<any>(null);
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

    const markRead = async (id: number) => {
        try {
            // Internal endpoint for single read might not exist, using mark-read as base logic
            // or we just mark it local if backend mark-read marks all
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch (e) { }
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

    const handleNotificationClick = (n: Notification) => {
        markRead(n.id);
        if (n.tipo === 'nueva_postulacion' && n.metadata) {
            try {
                const meta = JSON.parse(n.metadata);
                if (meta.candidate && meta.candidate.id) {
                    navigate(`/candidatos?highlight=${meta.candidate.id}`);
                    onClose();
                    return; // Exit directly
                }
            } catch (e) {
                console.error("Error parsing notification metadata", e);
            }
        }

        // Default action if no metadata or parsing fails
        if (n.tipo === 'nueva_postulacion') {
            navigate('/candidatos');
        } else {
            navigate('/dashboard');
        }
        onClose();
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

            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar relative">
                {/* PREVIEW OVERLAY */}
                <AnimatePresence>
                    {selectedPreview && (
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="absolute inset-0 bg-[#0d1117] z-50 flex flex-col p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Vista Previa</span>
                                <button onClick={() => setSelectedPreview(null)} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-600/20">
                                    {(selectedPreview.candidate.nombres || 'C')[0]}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white leading-tight">
                                        {selectedPreview.candidate.nombres} {selectedPreview.candidate.apellidos}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="p-1 bg-blue-500/20 text-blue-400 rounded-lg">
                                            <Zap size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-blue-400">Score IA: {selectedPreview.candidate.score}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="grid grid-cols-1 gap-3">
                                    <DetailItem icon={<Briefcase size={14} />} label="Cargo/Título" value={selectedPreview.candidate.cargo || 'No especificado'} />
                                    <DetailItem icon={<Phone size={14} />} label="Teléfono" value={selectedPreview.candidate.telefono || 'Sin datos'} />
                                    <DetailItem icon={<Mail size={14} />} label="Email" value={selectedPreview.candidate.email} />
                                    <DetailItem icon={<MapPin size={14} />} label="Ciudad" value={selectedPreview.candidate.ciudad} />
                                    <DetailItem icon={<GraduationCap size={14} />} label="Educación" value={selectedPreview.candidate.educacion} />
                                    <DetailItem icon={<Zap size={14} />} label="Experiencia" value={`${selectedPreview.candidate.experiencia} años`} />
                                </div>

                                <div className="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Vacante:</p>
                                    <p className="text-xs font-bold text-white">{selectedPreview.vacante.puesto}</p>
                                    <p className="text-[10px] text-[#3a94cc] font-mono mt-0.5">{selectedPreview.vacante.codigo}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => { navigate(`/candidatos?highlight=${selectedPreview.candidate.id}`); onClose(); }}
                                className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FileText size={16} />
                                Gestionar Candidato
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                onClick={() => handleNotificationClick(n)}
                            >
                                {!n.leida && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                                )}
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                                        n.tipo === 'nueva_postulacion' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {n.tipo === 'nueva_postulacion' ? <User size={16} /> : <Bell size={16} />}
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
                    onClick={() => { navigate('/candidatos'); onClose(); }}
                    className="text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest"
                >
                    Ver historial completo
                </button>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] uppercase font-black text-gray-500 tracking-wider leading-none mb-1">{label}</p>
            <p className="text-[11px] font-bold text-gray-300 truncate">{value}</p>
        </div>
    </div>
);

export default AdminNotificationPanel;
