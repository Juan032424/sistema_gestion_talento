import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Play, Pause, Plus, Users, Target, Sparkles, Globe, BarChart3,
    Clock, Mail, ExternalLink, X, Building2, Briefcase, Download,
    CheckCircle2, Loader2, Search, MapPin, User, AlertCircle,
    RefreshCw, Phone, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';
import api from '../../../api';
import { cn } from '../../../lib/utils';
import { useToast } from '../../ToastNotification';

// ============================================================
// TYPES
// ============================================================
interface Campaign {
    id: number;
    nombre: string;
    estado: 'active' | 'paused' | 'completed';
    candidatos_encontrados: number;
    candidatos_contactados: number;
    tasa_respuesta: number;
    ultima_ejecucion: string | null;
    puesto_nombre: string;
}

interface SourcedCandidate {
    id: number;
    nombre: string;
    email: string;
    fuente: string;
    ai_match_score: number;
    estado: string;
    ai_analysis: any;
}

interface ScrapedCandidate {
    nombre: string;
    email: string | null;
    telefono: string | null;
    ciudad: string;
    pais: string;
    cargo_actual: string | null;
    perfil_url: string | null;
    resumen: string | null;
    fuente: string;
    es_link_directo?: boolean;
    ai_match_score?: number;
    ai_analysis?: {
        score: number;
        strengths: string[];
        gaps: string[];
        recommendation: string;
        reasoning: string;
    };
}

interface SearchResult {
    success: boolean;
    candidatos: ScrapedCandidate[];
    candidatos_reales: number;
    links_directos: number;
    total_encontrados: number;
    fuentes_exitosas: number;
    fuentes_fallidas: number;
    errores: string[];
    ciudad: string;
    keywords: string;
    nota: string | null;
}

interface Analytics {
    overview: {
        total_campaigns: number;
        active_campaigns: number;
        total_candidates: number;
        avg_match_score: number;
    };
    by_source: Array<{ fuente: string; count: number; avg_score: number }>;
    top_candidates: SourcedCandidate[];
}

// ============================================================
// SOURCE CONFIG
// ============================================================
const FUENTES_DISPONIBLES = [
    { id: 'computrabajo', label: 'Computrabajo CO', icon: '💼', desc: 'Principal portal de empleo Colombia' },
    { id: 'elempleo', label: 'ElEmpleo.com', icon: '📋', desc: 'Portal ElEmpleo Colombia' },
    { id: 'google', label: 'Google (Perfiles Públicos)', icon: '🔎', desc: 'Perfiles indexados públicamente' },
    { id: 'magneto', label: 'Magneto365', icon: '🧲', desc: 'Red de empleo Colombia' },
    { id: 'sena', label: 'SENA / SPE', icon: '🏛️', desc: 'Servicio Público de Empleo' }
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const AISourcingHub: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'buscar' | 'campanas'>('buscar');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
    const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ---- SEARCH STATE ----
    const [searchKeywords, setSearchKeywords] = useState('');
    const [searchCity, setSearchCity] = useState('Cartagena');
    const [selectedFuentes, setSelectedFuentes] = useState<string[]>(['computrabajo', 'elempleo', 'google']);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [searchProgress, setSearchProgress] = useState('');
    const [expandedCandidates, setExpandedCandidates] = useState<Set<number>>(new Set());

    // Contact Modal (for campaign candidates)
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedCandidateForContact, setSelectedCandidateForContact] = useState<SourcedCandidate | null>(null);
    const [messageTemplate, setMessageTemplate] = useState('');

    const [newCampaign, setNewCampaign] = useState({
        vacante_id: '',
        nombre: '',
        fuentes: ['linkedin', 'indeed', 'computrabajo', 'elempleo'] as string[],
        auto_run: true
    });

    const fetchData = useCallback(async () => {
        try {
            const [campaignsRes, analyticsRes, vacanciesRes] = await Promise.all([
                api.get('/sourcing/campaigns').catch(() => ({ data: [] })),
                api.get('/sourcing/analytics').catch(() => ({ data: null })),
                api.get('/vacantes').catch(() => ({ data: [] }))
            ]);
            setCampaigns(campaignsRes.data);
            setAnalytics(analyticsRes.data);
            setVacancies(vacanciesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ---- SEARCH HANDLER ----
    const handleSearch = async () => {
        if (!searchKeywords.trim()) {
            showToast('Ingresa el nombre del cargo o vacante a buscar', 'error');
            return;
        }
        if (selectedFuentes.length === 0) {
            showToast('Selecciona al menos una fuente de búsqueda', 'error');
            return;
        }

        setSearchLoading(true);
        setSearchResults(null);
        setSearchProgress('Iniciando búsqueda en portales de Colombia...');

        const progressMessages = [
            'Consultando Computrabajo Colombia...',
            'Buscando en ElEmpleo.com...',
            'Analizando resultados de Google...',
            'Filtrando candidatos de Cartagena...',
            'Compilando perfiles encontrados...'
        ];

        let msgIdx = 0;
        const progressInterval = setInterval(() => {
            if (msgIdx < progressMessages.length) {
                setSearchProgress(progressMessages[msgIdx++]);
            }
        }, 3000);

        try {
            const res = await api.post('/sourcing/buscar-candidatos', {
                keywords: searchKeywords.trim(),
                ciudad: searchCity,
                fuentes: selectedFuentes,
                limit: 30
            });

            clearInterval(progressInterval);
            setSearchResults(res.data);
            setSearchProgress('');

            if (res.data.candidatos.length > 0) {
                showToast(`✅ ${res.data.candidatos.length} candidatos encontrados`, 'success');
            } else {
                showToast('No se encontraron candidatos. Intenta con otros términos.', 'error');
            }
        } catch (error: any) {
            clearInterval(progressInterval);
            setSearchProgress('');
            showToast(error.response?.data?.error || 'Error en la búsqueda', 'error');
        } finally {
            setSearchLoading(false);
        }
    };

    const toggleFuente = (id: string) => {
        setSelectedFuentes(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const toggleExpanded = (idx: number) => {
        setExpandedCandidates(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const handleRunCampaign = async (campaignId: number) => {
        try {
            await api.post(`/sourcing/campaigns/${campaignId}/run`);
            fetchData();
        } catch (error) { console.error('Error running campaign:', error); }
    };

    const handlePauseCampaign = async (campaignId: number) => {
        try {
            await api.patch(`/sourcing/campaigns/${campaignId}/pause`);
            fetchData();
        } catch (error) { console.error('Error pausing campaign:', error); }
    };

    const handleResumeCampaign = async (campaignId: number) => {
        try {
            await api.patch(`/sourcing/campaigns/${campaignId}/resume`);
            fetchData();
        } catch (error) { console.error('Error resuming campaign:', error); }
    };

    const loadCampaignCandidates = async (campaignId: number) => {
        try {
            const res = await api.get(`/sourcing/campaigns/${campaignId}/candidates`);
            setCandidates(res.data);
            setSelectedCampaign(campaignId);
        } catch (error) { console.error('Error loading candidates:', error); }
    };

    const handleCreateCampaign = async () => {
        if (!newCampaign.vacante_id || !newCampaign.nombre) {
            showToast('Completa los campos obligatorios', 'error');
            return;
        }
        try {
            await api.post('/sourcing/campaigns', newCampaign);
            setIsModalOpen(false);
            fetchData();
            showToast('Campaña creada exitosamente', 'success');
        } catch (error) {
            showToast('Error al crear la campaña', 'error');
        }
    };

    const openContactModal = (candidate: SourcedCandidate) => {
        setSelectedCandidateForContact(candidate);
        setMessageTemplate(`Hola ${candidate.nombre.split(' ')[0]},\n\nHe revisado tu perfil y tenemos una vacante que puede interesarte en DISCOL S.A.S. en Cartagena.\n\n¿Estarías disponible para una conversación?`);
        setContactModalOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copiado al portapapeles', 'success');
    };

    const exportToCSV = (candidatesToExport: ScrapedCandidate[]) => {
        const headers = ['Nombre', 'Cargo', 'Email', 'Teléfono', 'Ciudad', 'Fuente', 'URL Perfil', 'Resumen'];
        const rows = candidatesToExport.map(c => [
            c.nombre,
            c.cargo_actual || '',
            c.email || '',
            c.telefono || '',
            c.ciudad,
            c.fuente,
            c.perfil_url || '',
            (c.resumen || '').replace(/,/g, ';')
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidatos_${searchKeywords.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exportado a CSV exitosamente', 'success');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" />
                    <p className="text-slate-400 font-bold">Cargando AI Sourcing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Zap className="text-indigo-400" size={22} />
                        </div>
                        AI Sourcing — Colombia
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Búsqueda inteligente de candidatos</p>
                </div>
                {activeTab === 'campanas' && (
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase flex items-center gap-2">
                        <Plus size={14} /> Nueva Campaña
                    </button>
                )}
            </div>

            <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl border border-white/5 w-fit">
                <button onClick={() => setActiveTab('buscar')} className={cn("px-5 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2", activeTab === 'buscar' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white")}>
                    <Search size={13} /> Buscar Candidatos
                </button>
                <button onClick={() => setActiveTab('campanas')} className={cn("px-5 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2", activeTab === 'campanas' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white")}>
                    <Target size={13} /> Campañas ({campaigns.length})
                </button>
            </div>

            {activeTab === 'buscar' && (
                <div className="space-y-6">
                    <div className="bg-[#0d1421] border border-indigo-500/15 rounded-2xl p-6 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Cargo / Vacante *</label>
                                <input type="text" value={searchKeywords} onChange={(e) => setSearchKeywords(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-[#0a0c10] border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Ej: Ingeniero Civil..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ciudad 📍</label>
                                <select value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="w-full bg-[#0a0c10] border border-white/8 rounded-xl px-4 py-3 text-white text-sm">
                                    <option value="Cartagena">Cartagena ⭐</option>
                                    <option value="Barranquilla">Barranquilla</option>
                                    <option value="Bogotá">Bogotá</option>
                                    <option value="Medellín">Medellín</option>
                                    <option value="Cali">Cali</option>
                                    <option value="Colombia">Toda Colombia</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            {FUENTES_DISPONIBLES.map(fuente => (
                                <button key={fuente.id} onClick={() => toggleFuente(fuente.id)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all", selectedFuentes.includes(fuente.id) ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400" : "bg-white/2 border-white/8 text-gray-500")}>
                                    {fuente.label}
                                </button>
                            ))}
                        </div>

                        <button onClick={handleSearch} disabled={searchLoading} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-3">
                            {searchLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            {searchLoading ? 'Buscando...' : 'Buscar Candidatos'}
                        </button>
                    </div>

                    {searchResults && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-black text-sm">{searchResults.candidatos_reales} candidatos encontrados</h3>
                                <button onClick={() => exportToCSV(searchResults.candidatos)} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400">
                                    <Download size={12} /> Exportar CSV
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {searchResults.candidatos.map((c, idx) => (
                                    <ScrapedCandidateCard key={idx} candidate={c} index={idx} isExpanded={expandedCandidates.has(idx)} onToggleExpand={() => toggleExpanded(idx)} onCopy={copyToClipboard} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'campanas' && (
                <div className="space-y-6">
                    {analytics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MiniStatCard icon="🎯" label="Campañas" value={analytics.overview.active_campaigns} color="indigo" />
                            <MiniStatCard icon="👥" label="Candidatos" value={analytics.overview.total_candidates} color="emerald" />
                            <MiniStatCard icon="📊" label="Score Prom." value={`${analytics.overview.avg_match_score}%`} color="violet" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {campaigns.map(campaign => (
                                <CampaignCard key={campaign.id} campaign={campaign} onRun={handleRunCampaign} onPause={handlePauseCampaign} onResume={handleResumeCampaign} onViewCandidates={loadCampaignCandidates} isSelected={selectedCampaign === campaign.id} />
                            ))}
                        </div>
                        <div className="space-y-4 bg-[#161b22] border border-white/5 rounded-2xl p-4">
                            <h2 className="text-sm font-black text-white uppercase mb-3">Top Matches</h2>
                            {candidates.map(candidate => (
                                <CandidateCard key={candidate.id} candidate={candidate} onContact={() => openContactModal(candidate)} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 w-full max-w-lg">
                            <h3 className="text-xl font-black text-white mb-6">Nueva Campaña Automática</h3>
                            <div className="space-y-4">
                                <select value={newCampaign.vacante_id} onChange={(e) => setNewCampaign({ ...newCampaign, vacante_id: e.target.value })} className="w-full bg-[#0a0c10] border border-white/8 rounded-xl p-3 text-white">
                                    <option value="">Seleccionar vacante...</option>
                                    {vacancies.map(v => <option key={v.id} value={v.id}>{v.puesto_nombre}</option>)}
                                </select>
                                <input type="text" value={newCampaign.nombre} onChange={(e) => setNewCampaign({ ...newCampaign, nombre: e.target.value })} className="w-full bg-[#0a0c10] border border-white/8 rounded-xl p-3 text-white" placeholder="Nombre de la campaña" />
                                <button onClick={handleCreateCampaign} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase">Crear Campaña</button>
                                <button onClick={() => setIsModalOpen(false)} className="w-full text-xs text-gray-500 uppercase font-bold">Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {contactModalOpen && selectedCandidateForContact && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 w-full max-w-lg">
                            <h3 className="text-xl font-black text-white mb-2">Contactar Candidato</h3>
                            <p className="text-sm text-gray-400 mb-4">{selectedCandidateForContact.nombre}</p>
                            <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} className="w-full h-48 bg-[#0a0c10] border border-white/8 rounded-xl p-4 text-white text-sm mb-4" />
                            <div className="flex gap-3">
                                <button onClick={() => { copyToClipboard(messageTemplate); setContactModalOpen(false); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase">Copiary Cerrar</button>
                                <button onClick={() => setContactModalOpen(false)} className="px-6 py-3 bg-white/5 text-white rounded-xl font-black uppercase">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Subcomponents ---

const ScrapedCandidateCard: React.FC<{ candidate: ScrapedCandidate; index: number; isExpanded: boolean; onToggleExpand: () => void; onCopy: (text: string) => void }> = ({ candidate, index, isExpanded, onToggleExpand, onCopy }) => {
    const initials = candidate.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-[#161b22] border border-white/5 rounded-2xl p-4 group">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center text-xs font-black text-white">{initials}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{candidate.nombre}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{candidate.cargo_actual}</p>
                </div>
                {candidate.ai_match_score && (
                    <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black">{candidate.ai_match_score}%</div>
                )}
            </div>
            {candidate.ai_analysis && (
                <div className="mb-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">IA DISCOL</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase font-black">{candidate.ai_analysis.recommendation}</span>
                    </div>
                    {candidate.ai_analysis.strengths.slice(0, 2).map((s, i) => (
                        <div key={i} className="flex gap-1.5 text-[10px] text-slate-300 mb-0.5"><CheckCircle2 size={10} className="text-emerald-500 mt-0.5" /> {s}</div>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                {candidate.perfil_url && <a href={candidate.perfil_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-white/5 text-center text-[10px] font-bold text-gray-400 rounded-lg">Ver Perfil</a>}
                <button onClick={() => onCopy(candidate.email || '')} className="flex-1 py-1.5 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold rounded-lg leading-none">Copiar Email</button>
            </div>
        </motion.div>
    );
};

const CampaignCard: React.FC<{ campaign: Campaign; onRun: (id: number) => void; onPause: (id: number) => void; onResume: (id: number) => void; onViewCandidates: (id: number) => void; isSelected: boolean }> = ({ campaign, onRun, onPause, onResume, onViewCandidates, isSelected }) => (
    <div className={cn("bg-[#161b22] border rounded-2xl p-4 transition-all", isSelected ? "border-indigo-500" : "border-white/5")}>
        <div className="flex justify-between mb-3">
            <div><h3 className="text-sm font-black text-white">{campaign.nombre}</h3><p className="text-[10px] text-gray-500">{campaign.puesto_nombre}</p></div>
            <span className="text-[9px] font-black uppercase text-emerald-400">{campaign.estado}</span>
        </div>
        <div className="flex gap-4 mb-3">
            <div className="text-xs font-black text-white">{campaign.candidatos_encontrados} <span className="text-[9px] text-gray-600">Sourced</span></div>
            <div className="text-xs font-black text-white">{campaign.tasa_respuesta}% <span className="text-[9px] text-gray-600">Match</span></div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onRun(campaign.id)} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase"><Play size={10} className="inline mr-1" /> Ejecutar</button>
            <button onClick={() => onViewCandidates(campaign.id)} className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg"><Users size={12} /></button>
        </div>
    </div>
);

const CandidateCard: React.FC<{ candidate: SourcedCandidate; onContact: () => void }> = ({ candidate, onContact }) => (
    <div className="p-3 border-b border-white/5 hover:bg-white/2 transition-all">
        <div className="flex justify-between mb-1">
            <h4 className="text-xs font-black text-white">{candidate.nombre}</h4>
            <div className="text-[10px] font-black text-indigo-400">{candidate.ai_match_score}%</div>
        </div>
        <button onClick={onContact} className="text-[9px] font-black text-gray-500 uppercase hover:text-indigo-400 transition-colors">Contactar</button>
    </div>
);

const MiniStatCard: React.FC<{ icon: string; label: string; value: any; color: string }> = ({ icon, label, value }) => (
    <div className="bg-[#161b22] border border-white/5 p-4 rounded-2xl">
        <div className="text-xl mb-1">{icon}</div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
    </div>
);

export default AISourcingHub;
