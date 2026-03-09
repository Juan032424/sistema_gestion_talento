import React, { useState, useEffect } from 'react';
import { Trophy, Star, Send, Users, Gift, Medal, Plus, X } from 'lucide-react';
import api from '../../../api';
import { motion, AnimatePresence } from 'framer-motion';

const ReferralPortal: React.FC = () => {
    const [referrals, setReferrals] = useState([]);
    const [stats, setStats] = useState({ total: 0, points: 0, hired: 0 });
    const [leaderboard, setLeaderboard] = useState([]);
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        candidate_name: '',
        candidate_contact: '',
        vacancy_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/referidos');
            // Assuming backend returns { referrals: [], stats: {}, leaderboard: [] }
            // If it returns an array (old version), we handle it
            if (res.data.referrals) {
                setReferrals(res.data.referrals);
                setStats(res.data.stats);
                setLeaderboard(res.data.leaderboard);
            } else {
                setReferrals(res.data);
            }

            const vRes = await api.get('/vacantes');
            setVacancies(vRes.data);
        } catch (error) {
            console.error("Error fetching referrals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/referidos', formData);
            setFormData({ candidate_name: '', candidate_contact: '', vacancy_id: '' });
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error("Error saving referral", error);
        }
    };

    const getRecruiterLevel = (points: number) => {
        if (points >= 10000) return "Elite Recruiter";
        if (points >= 5000) return "Expert Recruiter";
        if (points >= 2000) return "Senior Recruiter";
        if (points >= 500) return "Pro Recruiter";
        return "Junior Recruiter";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black premium-gradient-text tracking-tighter">Portal de Referidos</h1>
                    <p className="text-slate-400 mt-2 font-medium">Gamificación de talento: Gana puntos por cada referido exitoso.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        REGISTRAR REFERIDO
                    </button>
                    <div className="glass-panel px-6 py-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nivel Actual</p>
                            <p className="text-2xl font-black text-white">{getRecruiterLevel(stats.points)}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 premium-card-glow">
                    <div className="flex items-center justify-center gap-4 mb-4 text-blue-400">
                        <Users size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Total Referidos</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{stats.total}</p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 premium-card-glow">
                    <div className="flex items-center justify-center gap-4 mb-4 text-amber-400">
                        <Star size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Puntos Ganados</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{stats.points.toLocaleString()}</p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 premium-card-glow">
                    <div className="flex items-center justify-center gap-4 mb-4 text-emerald-400">
                        <Gift size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Contratados</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{stats.hired}</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Send size={20} className="text-blue-500" />
                            Mis Referidos Recientes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {referrals.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Users size={40} className="mx-auto text-slate-600 mb-4 opacity-20" />
                                <p className="text-slate-500 font-bold">No has registrado referidos aún.</p>
                            </div>
                        ) : (
                            referrals.map((ref: any) => (
                                <div key={ref.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 font-bold uppercase">
                                            {ref.candidate_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{ref.candidate_name}</p>
                                            <p className="text-xs text-slate-500">Contacto: {ref.candidate_contact}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ref.status === 'Hired' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {ref.status}
                                        </span>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Medal size={14} />
                                            <span className="text-sm font-bold">+{ref.recruiter_points}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Trophy size={20} className="text-amber-500" />
                        Leaderboard
                    </h2>
                    <div className="space-y-6">
                        {leaderboard.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">Esperando primeros puestos...</p>
                        ) : (
                            leaderboard.map((user: any, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 font-bold text-sm w-4">{i + 1}</span>
                                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/5 uppercase">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{getRecruiterLevel(user.points)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-amber-500">{user.points}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Registro */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-[#161b22] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white">Nuevo Referido</h3>
                                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Nombre del Candidato</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.candidate_name}
                                        onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Contacto (Email/Cel)</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.candidate_contact}
                                        onChange={(e) => setFormData({ ...formData, candidate_contact: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ej: +57 301..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Vacante de Interés</label>
                                    <select
                                        required
                                        value={formData.vacancy_id}
                                        onChange={(e) => setFormData({ ...formData, vacancy_id: e.target.value })}
                                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Selecciona una vacante</option>
                                        {vacancies.map((v: any) => (
                                            <option key={v.id} value={v.id}>{v.codigo_requisicion} - {v.puesto_nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-all active:scale-95 mt-4">
                                    GUARDAR REFERIDO
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralPortal;
