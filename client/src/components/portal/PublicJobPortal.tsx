import React, { useState, useEffect, useCallback } from 'react';
import {
    Briefcase, MapPin, Clock, Search, Building2,
    X, ChevronRight, Zap
} from 'lucide-react';
import api from '../../api';
import JobApplicationForm from './JobApplicationForm';
import { useCandidateAuth } from '../../context/CandidateAuthContext';

interface PublicJob {
    id: number;
    puesto_nombre: string;
    descripcion: string;
    ubicacion: string;
    salario_min: number;
    salario_max: number;
    experiencia_requerida: number;
    tipo_contrato: string;
    modalidad_trabajo: string;
    fecha_creacion: string;
    slug: string;
    views_count: number;
    applications_count: number;
    is_featured: boolean;
}

const PublicJobPortal: React.FC = () => {
    const { user, isAuthenticated } = useCandidateAuth();

    const [jobs, setJobs] = useState<PublicJob[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<PublicJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedModality, setSelectedModality] = useState('');
    const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
    const [showApplicationForm, setShowApplicationForm] = useState(false);

    const fetchPublicJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/applications/public/jobs');
            setJobs(res.data);
            setFilteredJobs(res.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPublicJobs();
    }, [fetchPublicJobs]);

    // Tracking view_job
    useEffect(() => {
        const trackView = async () => {
            if (selectedJob && isAuthenticated && user) {
                try {
                    await api.post(`/candidate-auth/track-view/${selectedJob.id}`, {
                        candidateId: user.id,
                        interactionType: 'VIEW_JOB'
                    });
                    console.log(`✅ Actividad rastreada: Vista de vacante ${selectedJob.id}`);
                } catch (error) {
                    console.warn('⚠️ No se pudo rastrear la vista de la vacante:', error);
                }
            }
        };
        trackView();
    }, [selectedJob, isAuthenticated, user]);

    const filterJobs = useCallback(() => {
        let filtered = [...jobs];
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.puesto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedLocation) {
            filtered = filtered.filter(job => job.ubicacion === selectedLocation);
        }
        if (selectedModality) {
            filtered = filtered.filter(job => job.modalidad_trabajo === selectedModality);
        }
        setFilteredJobs(filtered);
    }, [jobs, searchTerm, selectedLocation, selectedModality]);

    useEffect(() => {
        filterJobs();
    }, [filterJobs]);

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return `Hace ${Math.floor(diffDays / 7)} semanas`;
    };

    const locations = Array.from(new Set(jobs.map(job => job.ubicacion))).filter(Boolean);
    const modalities = Array.from(new Set(jobs.map(job => job.modalidad_trabajo))).filter(Boolean);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 text-slate-800 font-sans">
            {/* Header & Search - Corporate Blue Theme */}
            <div className="bg-blue-950 pb-12 pt-8 px-6 shadow-xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Portal de Empleos</h1>
                            <p className="text-blue-200">
                                {isAuthenticated && user
                                    ? `Bienvenido(a), ${user.nombre}. Explora nuestras vacantes.`
                                    : 'Encuentra tu próxima oportunidad profesional con nosotros.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-2 rounded-2xl shadow-lg shadow-black/5 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar cargo, empresa o palabra clave..."
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                            />
                        </div>
                        <div className="h-px md:h-12 w-full md:w-px bg-slate-200 my-auto"></div>
                        <div className="flex-1 md:max-w-xs relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 bg-transparent text-slate-800 appearance-none focus:outline-none cursor-pointer"
                            >
                                <option value="">Todas las ubicaciones</option>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="hidden md:block w-px h-12 bg-slate-200 my-auto"></div>
                        <div className="flex-1 md:max-w-xs relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <select
                                value={selectedModality}
                                onChange={(e) => setSelectedModality(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 bg-transparent text-slate-800 appearance-none focus:outline-none cursor-pointer"
                            >
                                <option value="">Cualquier modalidad</option>
                                {modalities.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-blue-200 text-sm px-2">
                        <p>Mostrando {filteredJobs.length} vacantes activas</p>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-900/50 rounded-lg border border-blue-800/50">Recientes</span>
                            <span className="px-3 py-1 hover:bg-blue-900/30 rounded-lg cursor-pointer transition-colors">Destacadas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs list */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-200 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                            {filteredJobs.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                >
                                    {job.is_featured && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Destacada</div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            <Building2 size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{job.puesto_nombre}</h3>
                                            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                                                <Building2 size={14} />
                                                DISCOL SAS
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm mb-5 line-clamp-2 leading-relaxed">
                                        {job.descripcion}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg flex items-center gap-1.5">
                                            <MapPin size={12} /> {job.ubicacion}
                                        </span>
                                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
                                            <Zap size={12} /> {job.modalidad_trabajo}
                                        </span>
                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg flex items-center gap-1.5">
                                            <Briefcase size={12} /> {job.tipo_contrato}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 mb-0.5">Rango Salarial</span>
                                            <span className="text-sm font-bold text-slate-900">${job.salario_min.toLocaleString()} - ${job.salario_max.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                            <Clock size={12} /> {getTimeAgo(job.fecha_creacion)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Job Details */}
            {selectedJob && !showApplicationForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-3xl w-full p-0 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-blue-950 px-8 py-6 relative shrink-0">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-6 right-6 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.puesto_nombre}</h2>
                            <div className="flex flex-wrap gap-4 text-blue-200 text-sm">
                                <span className="flex items-center gap-1.5"><Building2 size={16} /> DISCOL SAS</span>
                                <span className="flex items-center gap-1.5"><MapPin size={16} /> {selectedJob.ubicacion}</span>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Salario</p>
                                    <p className="text-sm font-bold text-blue-700">${selectedJob.salario_min.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Modalidad</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedJob.modalidad_trabajo}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Contrato</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedJob.tipo_contrato}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Experiencia</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedJob.experiencia_requerida} años</p>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h4 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Descripción del Puesto</h4>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                    {selectedJob.descripcion}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                            <button
                                onClick={() => setShowApplicationForm(true)}
                                className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5 transition-all"
                            >
                                Postularme Ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showApplicationForm && selectedJob && (
                <JobApplicationForm
                    vacancyId={selectedJob.id}
                    vacancyTitle={selectedJob.puesto_nombre}
                    onClose={() => { setShowApplicationForm(false); setSelectedJob(null); }}
                />
            )}
        </div>
    );
};

export default PublicJobPortal;
