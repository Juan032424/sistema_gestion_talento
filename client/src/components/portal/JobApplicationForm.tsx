import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, FileText, Send, CheckCircle, Link as LinkIcon, Copy, X } from 'lucide-react';
import api from '../../api';
import { useCandidateAuth } from '../../context/CandidateAuthContext';

interface JobApplicationFormProps {
    vacancyId: number;
    vacancyTitle: string;
    onClose: () => void;
}

interface FormData {
    nombre: string;
    email: string;
    telefono: string;
    titulo_profesional: string;
    experiencia_anos: number;
    salario_esperado: number;
    disponibilidad: string;
    carta_presentacion: string;
    cv_url: string;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ vacancyId, vacancyTitle, onClose }) => {
    const { user } = useCandidateAuth();

    // Pre-llenar datos si está logueado
    const [formData, setFormData] = useState<FormData>({
        nombre: user?.nombre || '',
        email: user?.email || '',
        telefono: user?.telefono || '',
        titulo_profesional: user?.titulo_profesional || '',
        experiencia_anos: 0,
        salario_esperado: 0,
        disponibilidad: 'Inmediata',
        carta_presentacion: user?.biografia || '',
        cv_url: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [matchScore, setMatchScore] = useState(0);
    const [trackingUrl, setTrackingUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const isSubmitted = useRef(false);

    // Track FORM START
    useEffect(() => {
        if (user?.id) {
            api.post(`/candidate-auth/track-view/${vacancyId}`, {
                candidateId: user.id,
                interactionType: 'START_APPLICATION' // Send additional info to indicate start
            }).catch(console.error);
        }

        // Cleanup: Track ABANDONMENT if not submitted
        return () => {
            if (!isSubmitted.current && !success && user?.id) {
                api.post(`/candidate-auth/track-view/${vacancyId}`, {
                    candidateId: user.id,
                    interactionType: 'ABANDON_APPLICATION'
                }).catch(console.error);
            }
        };
    }, [user, vacancyId, success]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await api.post('/applications/apply', {
                vacancyId,
                candidateData: {
                    ...formData,
                    candidateAccountId: user?.id // Enviar ID de cuenta para vincular
                }
            });

            isSubmitted.current = true;

            setMatchScore(response.data.matchScore);
            setTrackingUrl(response.data.trackingUrl || '');
            setSuccess(true);

        } catch (error) {
            console.error('Error applying:', error);
            alert('Error al enviar tu postulación. Por favor intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const copyTrackingUrl = () => {
        navigator.clipboard.writeText(trackingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>

                    <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                        <CheckCircle className="text-green-500" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">¡Postulación Exitosa!</h3>
                    <p className="text-slate-500 mb-8 text-center px-4">
                        Tu perfil ha sido enviado para la vacante <span className="font-bold text-slate-800 block mt-1">{vacancyTitle}</span>
                    </p>

                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl"></div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1 text-center">Nivel de Coincidencia (IA)</p>
                        <div className="text-5xl font-black text-blue-600 text-center mb-1">{matchScore}%</div>
                        <p className="text-xs text-blue-600/80 text-center font-medium">
                            {matchScore >= 80 ? '¡Tu perfil es ideal!' : matchScore >= 60 ? 'Tus habilidades coinciden bien' : 'Tu perfil será revisado'}
                        </p>
                    </div>

                    {/* Tracking URL */}
                    {trackingUrl && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <LinkIcon size={16} className="text-slate-400" />
                                <p className="text-sm font-bold text-slate-700">Link de Seguimiento</p>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">
                                Consulta el estado de tu proceso en cualquier momento:
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={trackingUrl}
                                    readOnly
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-600 truncate font-mono select-all"
                                />
                                <button
                                    onClick={copyTrackingUrl}
                                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition-colors"
                                    title="Copiar link"
                                >
                                    {copied ? '✓' : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        Cerrar y Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                {/* Header */}
                <div className="bg-blue-950 px-8 py-6 shrink-0 flex justify-between items-start relative overflow-hidden">
                    {/* Decorative background jobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white">Formulario de Postulación</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-blue-100 text-xs font-medium border border-white/10">Vacante</span>
                            <span className="text-blue-200 text-sm font-medium">{vacancyTitle}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all relative z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Información Personal */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <User size={16} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Información Personal
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Nombre Completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                        placeholder="Juan Pérez"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Teléfono *
                                    </label>
                                    <input
                                        type="tel"
                                        name="telefono"
                                        required
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                        placeholder="+57 300 123 4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Título Profesional *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo_profesional"
                                        required
                                        value={formData.titulo_profesional}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                        placeholder="Ej: Desarrollador Full Stack"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Experiencia y Expectativas */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Briefcase size={16} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Experiencia y Expectativas
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Años de experiencia *
                                    </label>
                                    <input
                                        type="number"
                                        name="experiencia_anos"
                                        required
                                        min="0"
                                        value={formData.experiencia_anos}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Salario Esperado (COP)
                                    </label>
                                    <input
                                        type="number"
                                        name="salario_esperado"
                                        value={formData.salario_esperado}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                        placeholder="3500000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                        Disponibilidad *
                                    </label>
                                    <select
                                        name="disponibilidad"
                                        required
                                        value={formData.disponibilidad}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer appearance-none"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 1rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '2.5rem'
                                        }}
                                    >
                                        <option value="Inmediata">Inmediata</option>
                                        <option value="1 semana">1 semana</option>
                                        <option value="2 semanas">2 semanas</option>
                                        <option value="1 mes">1 mes</option>
                                        <option value="A convenir">A convenir</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Carta de Presentación */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Carta de Presentación
                                </h3>
                            </div>

                            <textarea
                                name="carta_presentacion"
                                rows={4}
                                value={formData.carta_presentacion}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none transition-colors"
                                placeholder="Cuéntanos por qué eres el candidato ideal para esta posición..."
                            />
                        </div>

                        {/* CV URL */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <LinkIcon size={16} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Enlace a CV
                                </h3>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                    URL de tu CV (LinkedIn, Google Drive, etc.)
                                </label>
                                <input
                                    type="url"
                                    name="cv_url"
                                    value={formData.cv_url}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                            >
                                {submitting ? (
                                    <>Enviando...</>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Postulación
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationForm;
