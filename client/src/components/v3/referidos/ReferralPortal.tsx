import React, { useState, useEffect } from 'react';
import { Trophy, Star, Send, Users, Gift, Medal } from 'lucide-react';
import api from '../../../api';
import { motion } from 'framer-motion';

const ReferralPortal: React.FC = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        try {
            const res = await api.get('/referidos');
            setReferrals(res.data);
        } catch (error) {
            console.error("Error fetching referrals", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black premium-gradient-text tracking-tighter">Portal de Referidos</h1>
                    <p className="text-slate-400 mt-2 font-medium">Gamificación de talento: Gana puntos por cada referido exitoso.</p>
                </div>
                <div className="glass-panel px-6 py-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                        <Trophy size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu Recruiter Level</p>
                        <p className="text-2xl font-black text-white">Senior Recruiter</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-panel p-6 premium-card-glow"
                >
                    <div className="flex items-center gap-4 mb-4 text-blue-400">
                        <Users size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Total Referidos</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{referrals.length}</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-panel p-6 premium-card-glow"
                >
                    <div className="flex items-center gap-4 mb-4 text-amber-400">
                        <Star size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Puntos Ganados</h3>
                    </div>
                    <p className="text-4xl font-black text-white">4,250</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-panel p-6 premium-card-glow"
                >
                    <div className="flex items-center gap-4 mb-4 text-emerald-400">
                        <Gift size={24} />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Premios Disponibles</h3>
                    </div>
                    <p className="text-4xl font-black text-white">3</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Referral List */}
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Send size={20} className="text-blue-500" />
                            Mis Referidos Recientes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {referrals.map((ref: any) => (
                            <div key={ref.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 font-bold">
                                        {ref.candidate_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{ref.candidate_name}</p>
                                        <p className="text-xs text-slate-500">Referido por: {ref.referrer_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ref.status === 'Hired' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {ref.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Medal size={14} />
                                        <span className="text-sm font-bold">+{ref.recruiter_points}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Trophy size={20} className="text-amber-500" />
                        Leaderboard
                    </h2>
                    <div className="space-y-6">
                        {[
                            { name: 'Diana R.', points: 12500, level: 'Elite' },
                            { name: 'Marcos S.', points: 9800, level: 'Diamond' },
                            { name: 'Isabella C.', points: 8500, level: 'Senior' },
                            { name: 'Ricardo T.', points: 4250, level: 'Senior' }
                        ].map((user, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-bold text-sm w-4">{i + 1}</span>
                                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/5">
                                        {user.name.split(' ')[0][0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{user.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{user.level}</p>
                                    </div>
                                </div>
                                <p className="text-sm font-black text-amber-500">{user.points}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralPortal;
