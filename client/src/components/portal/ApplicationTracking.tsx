import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle, Clock, AlertTriangle, XCircle,
    MapPin, DollarSign, Briefcase,
    TrendingUp, MessageCircle, Star, Bell
} from 'lucide-react';
import api from '../../api';

interface Application {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    estado: string;
    fecha_postulacion: string;
    fecha_ultima_actualizacion: string;
    auto_match_score: number;
    notas_reclutador: string;
    candidate_notes: string;
    rating_by_candidate: number;
}

interface Vacancy {
    puesto_nombre: string;
    ubicacion: string;
    salario_min: number;
    salario_max: number;
    modalidad_trabajo: string;
    empresa_nombre: string;
}

interface TimelineItem {
    estado: string;
    fecha: string;
    mensaje: string;
}

interface Notification {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    is_read: boolean;
    created_at: string;
    action_url: string;
}

const ApplicationTracking: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [application, setApplication] = useState<Application | null>(null);
    const [vacancy, setVacancy] = useState<Vacancy | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        loadApplicationStatus();
    }, [token]);

    const loadApplicationStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tracking/${token}`);

            if (response.data.success) {
                setApplication(response.data.application);
                setVacancy(response.data.vacancy);
                setTimeline(response.data.timeline);
                setNotifications(response.data.notifications);
                setRating(response.data.application.rating_by_candidate || 0);
            }
        } catch (err: any) {
            console.error('Error loading status:', err);
            setError(err.response?.data?.error || 'Link de tracking inválido o expirado');
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async () => {
        if (!rating && !feedback) return;

        try {
            setSubmittingFeedback(true);
            await api.post(`/tracking/${token}/feedback`, {
                rating,
                feedback
            });
            alert('¡Gracias por tu feedback!');
        } catch (err) {
            console.error('Error submitting feedback:', err);
            alert('Error enviando feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const markNotificationAsRead = async (notificationId: number) => {
        try {
            await api.post(`/tracking/${token}/notification/${notificationId}/read`);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
        } catch (err) {
            console.error('Error marking notification:', err);
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'Contratado':
                return <CheckCircle className="text-green-400" size={24} />;
            case 'Entrevista':
            case 'Preseleccionado':
                return <TrendingUp className="text-blue-400" size={24} />;
            case 'En Revisión':
            case 'Nueva':
                return <Clock className="text-yellow-400" size={24} />;
            case 'Descartado':
            case 'Retirado':
                return <XCircle className="text-red-400" size={24} />;
            default:
                return <AlertTriangle className="text-gray-400" size={24} />;
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'Contratado':
                return 'from-green-500/20 to-emerald-600/20 border-green-400/30';
            case 'Entrevista':
            case 'Preseleccionado':
                return 'from-blue-500/20 to-cyan-600/20 border-blue-400/30';
            case 'En Revisión':
            case 'Nueva':
                return 'from-yellow-500/20 to-orange-600/20 border-yellow-400/30';
            case 'Descartado':
            case 'Retirado':
                return 'from-red-500/20 to-rose-600/20 border-red-400/30';
            default:
                return 'from-gray-500/20 to-slate-600/20 border-gray-400/30';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
                <div className="text-white text-xl">Cargando...</div>
            </div>
        );
    }

    if (error || !application || !vacancy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-400/30 rounded-3xl p-8 max-w-md text-center">
                    <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                    <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                    <p className="text-gray-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                Seguimiento de Postulación
                            </h1>
                            <p className="text-blue-100 text-sm sm:text-base">
                                {vacancy.puesto_nombre} · {vacancy.empresa_nombre || 'DISCOL SAS'}
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <Briefcase size={48} className="text-white/30" />
                        </div>
                    </div>
                </div>

                {/* Estado Actual */}
                <div className={`bg-gradient-to-br ${getEstadoColor(application.estado)} rounded-3xl p-6 border shadow-xl`}>
                    <div className="flex items-center gap-4 mb-4">
                        {getEstadoIcon(application.estado)}
                        <div>
                            <p className="text-sm text-gray-400">Estado Actual</p>
                            <h2 className="text-2xl font-bold text-white">{application.estado}</h2>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-sm text-gray-400">Match Score</p>
                            <div className="text-3xl font-bold text-white">{application.auto_match_score}%</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                        <div>
                            <p className="text-gray-400">Postulado el</p>
                            <p className="text-white font-semibold">
                                {new Date(application.fecha_postulacion).toLocaleDateString('es-CO')}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400">Última actualización</p>
                            <p className="text-white font-semibold">
                                {new Date(application.fecha_ultima_actualizacion).toLocaleDateString('es-CO')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notificaciones */}
                {notifications.length > 0 && (
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Bell className="text-blue-400" size={20} />
                            <h3 className="text-xl font-bold text-white">Notificaciones</h3>
                        </div>
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 rounded-xl border ${notification.is_read
                                        ? 'bg-white/5 border-white/10'
                                        : 'bg-blue-500/10 border-blue-400/30'
                                        }`}
                                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-white text-sm">{notification.titulo}</p>
                                            <p className="text-gray-300 text-xs mt-1">{notification.mensaje}</p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                {new Date(notification.created_at).toLocaleString('es-CO')}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6">Línea de Tiempo</h3>
                    <div className="space-y-4">
                        {timeline.map((item, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                    {index < timeline.length - 1 && (
                                        <div className="w-0.5 h-full bg-gradient-to-b from-blue-400 to-transparent mt-2"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    <p className="text-white font-semibold">{item.estado}</p>
                                    <p className="text-gray-400 text-sm">{item.mensaje}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(item.fecha).toLocaleString('es-CO')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Información de la Vacante */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Información de la Vacante</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-blue-400" size={18} />
                            <div>
                                <p className="text-gray-400">Ubicación</p>
                                <p className="text-white font-semibold">{vacancy.ubicacion}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Briefcase className="text-blue-400" size={18} />
                            <div>
                                <p className="text-gray-400">Modalidad</p>
                                <p className="text-white font-semibold">{vacancy.modalidad_trabajo}</p>
                            </div>
                        </div>
                        {vacancy.salario_min && (
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-blue-400" size={18} />
                                <div>
                                    <p className="text-gray-400">Salario</p>
                                    <p className="text-white font-semibold">
                                        ${vacancy.salario_min.toLocaleString()} - ${vacancy.salario_max?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback del Candidato */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">¿Cómo va tu experiencia?</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-300 text-sm mb-3">Califica tu experiencia con este proceso:</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={32}
                                            className={rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-300 text-sm block mb-2">
                                Comparte tu feedback (opcional):
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                                placeholder="¿Cómo ha sido tu experiencia hasta ahora?"
                            />
                        </div>
                        <button
                            onClick={submitFeedback}
                            disabled={submittingFeedback || (!rating && !feedback)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            {submittingFeedback ? 'Enviando...' : 'Enviar Feedback'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-400 text-sm pb-8">
                    <p>¿Tienes preguntas? Contacta a {vacancy.empresa_nombre || 'DISCOL SAS'}</p>
                    <p className="text-xs mt-2">Este link de seguimiento es privado. No lo compartas.</p>
                </div>
            </div>
        </div>
    );
};

export default ApplicationTracking;
