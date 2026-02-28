import React, { useState, useEffect } from 'react';
import { Bookmark, Briefcase, MapPin, DollarSign, Clock, ChevronRight, Trash2, LogIn } from 'lucide-react';
import api from '../../api';
import { useCandidateAuth } from '../../context/CandidateAuthContext';
import JobApplicationForm from './JobApplicationForm';

interface SavedJob {
    id: number;
    vacancy_id: number;
    puesto_nombre: string;
    descripcion: string;
    ubicacion: string;
    salario_min: number;
    salario_max: number;
    modalidad_trabajo: string;
    fecha_guardado: string;
}

const SavedJobs: React.FC = () => {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const { user, isAuthenticated } = useCandidateAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedJobs();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchSavedJobs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/candidates/saved-jobs');
            setSavedJobs(response.data.savedJobs || []);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
            // No hacemos nada en UI si es 401
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSaved = async (vacancyId: number) => {
        try {
            await api.delete(`/candidates/saved-jobs/${vacancyId}`);
            setSavedJobs(savedJobs.filter(job => job.vacancy_id !== vacancyId));
        } catch (error) {
            console.error('Error removing saved job:', error);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return `Hace ${Math.floor(diffDays / 7)} semanas`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Bookmark size={24} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 min-h-screen">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="text-gray-400" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Inicia Sesión</h2>
                <p className="text-gray-400 max-w-md mb-8 text-lg">
                    Inicia sesión para ver tus vacantes guardadas y postularte rápidamente.
                </p>
                <div className="flex gap-4">
                    <a href="/portal" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-white/10">
                        Volver al Portal
                    </a>
                    <button
                        onClick={() => document.getElementById('login-modal-trigger')?.click()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Vacantes Guardadas</h1>
                    <p className="text-gray-400">Tus oportunidades favoritas</p>
                </div>

                {savedJobs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-white/10">
                            <Bookmark size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No has guardado vacantes aún</h3>
                        <p className="text-gray-400 mb-6">Explora y guarda las vacantes que te interesen</p>
                        <a
                            href="/portal"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all"
                        >
                            Explorar Vacantes
                            <ChevronRight size={18} />
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {savedJobs.map((job) => (
                            <div
                                key={job.id}
                                className="group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
                            >
                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveSaved(job.vacancy_id)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-red-400 transition-all"
                                    title="Eliminar de guardados"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="mb-4 pr-12">
                                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{job.puesto_nombre}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock size={14} />
                                            <span>Guardado {getTimeAgo(job.fecha_guardado)}</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                        {job.descripcion || 'Únete a nuestro equipo y contribuye en proyectos innovadores.'}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 border border-white/10 text-gray-300 flex items-center gap-1.5">
                                            <MapPin size={12} />
                                            {job.ubicacion}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600/10 border border-green-500/20 text-green-400 flex items-center gap-1.5">
                                            <Briefcase size={12} />
                                            {job.modalidad_trabajo}
                                        </div>
                                    </div>

                                    {/* Salary */}
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 pb-4 border-b border-white/5">
                                        <DollarSign size={16} />
                                        <span className="font-medium">
                                            ${job.salario_min?.toLocaleString()} - ${job.salario_max?.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedJob(job);
                                                setShowApplicationForm(true);
                                            }}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                        >
                                            <Briefcase size={18} />
                                            Postularme
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Form Modal */}
            {showApplicationForm && selectedJob && (
                <JobApplicationForm
                    vacancyId={selectedJob.vacancy_id}
                    vacancyTitle={selectedJob.puesto_nombre}
                    onClose={() => {
                        setShowApplicationForm(false);
                        setSelectedJob(null);
                    }}
                />
            )}
        </div>
    );
};

export default SavedJobs;
