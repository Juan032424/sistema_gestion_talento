import React, { useState, useEffect } from 'react';
import { Bot, Activity, Brain, AlertTriangle, Play, CheckCircle2, History } from 'lucide-react';
import api from '../../../api';
import { motion, AnimatePresence } from 'framer-motion';

const AIInsightsHub: React.FC = () => {
    const [logs, setLogs] = useState([]);
    const [activeAgents] = useState([
        { id: 'sourcing', name: 'Sourcing & Parsing', status: 'Online', lastRun: 'Hace 5m', health: 98 },
        { id: 'screening', name: 'WhatsApp Screening', status: 'Online', lastRun: 'Hace 12m', health: 100 },
        { id: 'analyst', name: 'Financial Analyst', status: 'Idle', lastRun: 'Hace 1h', health: 100 }
    ]);

    useEffect(() => {
        fetchLogs();
        const timer = setInterval(fetchLogs, 10000);
        return () => clearInterval(timer);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/agents/logs');
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs", error);
        }
    };

    const triggerAgent = async (agentId: string) => {
        // Implementation for triggering agents (simulation)
        console.log(`Triggering ${agentId}...`);
    };

    return (
        <div className="space-y-8 p-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black premium-gradient-text tracking-tighter">AI Logic Hub</h1>
                    <p className="text-slate-400 mt-2 font-medium italic">Orquestación de Agentes Autónomos DISCOL v3.0</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-blue-400">
                                <Bot size={18} />
                            </div>
                        ))}
                    </div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Sistemas Operativos
                    </span>
                </div>
            </header>

            {/* Agent Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeAgents.map((agent) => (
                    <motion.div
                        key={agent.id}
                        whileHover={{ scale: 1.02 }}
                        className="glass-panel p-6 relative group overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Bot size={80} />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${agent.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                <Bot size={24} />
                            </div>
                            <button
                                onClick={() => triggerAgent(agent.id)}
                                className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                            >
                                <Play size={18} fill="currentColor" />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`w-2 h-2 rounded-full ${agent.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{agent.status}</span>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-500">Uptime Health</span>
                                <span className="text-emerald-400">{agent.health}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${agent.health}%` }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase pt-1">
                                <span>Última Acción</span>
                                <span>{agent.lastRun}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Real-time Logs */}
                <div className="lg:col-span-8 glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <History size={20} className="text-indigo-400" />
                            Flujo de Pensamiento de IA
                        </h2>
                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase">
                            Live Stream
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence initial={false}>
                            {logs.map((log: any) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex gap-4 items-start"
                                >
                                    <div className={`p-2 rounded-lg mt-1 ${log.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                                        }`}>
                                        {log.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{log.agent_name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{new Date(log.performed_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium">{log.details}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-bold uppercase">{log.action}</span>
                                            {log.entity_id && (
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold">#{log.entity_type} {log.entity_id}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {logs.length === 0 && (
                            <div className="py-12 text-center text-slate-500 italic">No hay actividad reciente de los agentes.</div>
                        )}
                    </div>
                </div>

                {/* Cognitive Metrics */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <Brain size={20} className="text-violet-400" />
                            Predicción T2H
                        </h2>
                        <div className="space-y-6">
                            {[
                                { role: 'Ingeniero Sr', probability: 85, time: '12 días', status: 'On Track' },
                                { role: 'Analista GH', probability: 40, time: '25 días', status: 'At Risk' }
                            ].map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-white">{p.role}</span>
                                        <span className={p.probability > 70 ? 'text-emerald-400' : 'text-amber-400'}>{p.probability}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${p.probability > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${p.probability}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                        <span>Est. {p.time}</span>
                                        <span className={p.status === 'On Track' ? 'text-emerald-500/60' : 'text-amber-500/60'}>{p.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                            Ejecutar Predictor ML
                        </button>
                    </div>

                    <div className="glass-panel p-8 bg-blue-600/5 border-blue-500/20">
                        <div className="flex items-center gap-4 mb-4 text-blue-400">
                            <Activity size={24} />
                            <h3 className="font-bold uppercase tracking-widest text-xs">Carga Cognitiva</h3>
                        </div>
                        <p className="text-3xl font-black text-white">1.2 TFLOPS</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Uso de API GPT-4o / Claude 3.5</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsightsHub;
