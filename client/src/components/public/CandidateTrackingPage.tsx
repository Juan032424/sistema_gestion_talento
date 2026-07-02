import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    MapPin, 
    Briefcase, 
    Calendar,
    ArrowLeft,
    Heart,
    Shield,
    FileText,
    Search,
    Loader2,
    MessageCircle
} from 'lucide-react';

interface TimelineEvent {
    estado: string;
    fecha: string;
    mensaje: string;
    completed: boolean;
}

interface ProcessedData {
    application: {
        id: number;
        nombre: string;
        estado: string;
        fecha_postulacion: string;
        fecha_ultima_actualizacion?: string;
        auto_match_score: number;
        calificacion_tecnica?: number;
        resultado_final?: string;
        etapa_seguimiento?: string;
        estado_entrevista?: string;
        fecha_entrevista?: string;
        motivo_no_apto?: string;
    };
    vacancy: {
        puesto_nombre: string;
        codigo_requisicion?: string;
        ubicacion: string;
        modalidad_trabajo: string;
        empresa_nombre: string;
    };
    timeline: TimelineEvent[];
    progress: number;
    message: {
        title: string;
        content: string;
        type: 'success' | 'info' | 'neutral' | 'reject';
    };
}

// Process raw API response into display data
function processApiData(apiData: any): ProcessedData {
    const app = apiData.application || {};
    const vac = apiData.vacancy || {};
    
    let estado = app.estado || 'Nueva';

    // Map `etapa_seguimiento` (from recruiter tool) to timeline `STATES`
    if (app.etapa_seguimiento) {
        switch (app.etapa_seguimiento) {
            case 'Postulación':
                estado = 'Nueva';
                break;
            case 'Entrevista RH':
                estado = 'En Revisión';
                break;
            case 'Prueba Técnica':
                estado = 'Preseleccionado';
                break;
            case 'Entrevista Técnica':
            case 'Entrevista Final':
                estado = 'Entrevista';
                break;
            case 'Estudio de Seguridad':
            case 'Oferta':
                estado = 'Oferta';
                break;
            case 'Contratado':
                estado = 'Contratado';
                break;
            case 'Descartado':
                estado = 'Descartado';
                break;
        }
    }

    if (app.resultado_final === 'No Apto') {
        estado = 'Descartado';
    }

    const STATES = [
        'Nueva',
        'En Revisión',
        'Preseleccionado',
        'Entrevista',
        'Oferta',
        'Contratado'
    ];

    let stateIndex = STATES.indexOf(estado);
    if (estado === 'Descartado') {
        // If discarded, visually mark all previous steps as done? 
        // Or keep it neutral? We'll let stateIndex = -1, which makes progress visually handle it via the reject condition. 
        // But to avoid the timeline looking completely empty, we could find out how far they got? In this simple case we'll handle the message and progress fully.
    }
    
    let progress = stateIndex >= 0 ? Math.max(10, ((stateIndex + 1) / STATES.length) * 100) : 10;

    let msg = { title: '', content: '', type: 'neutral' as any };

    if (estado === 'Contratado') {
        progress = 100;
        msg = {
            title: '¡BIENVENIDO A LA FAMILIA DISCOL! 🎉',
            content: 'Estamos muy emocionados de que hayas sido seleccionado para formar parte de nuestro equipo. Tu talento y dedicación han destacado entre muchos perfiles, y estamos seguros de que juntos alcanzaremos grandes metas. ¡Nos vemos pronto!',
            type: 'success'
        };
    } else if (estado === 'Rechazado' || estado === 'Descartado') {
        progress = 100;
        stateIndex = 0; // Visually keep the timeline at step 1 for discarded candidates if history lost
        msg = {
            title: 'Gracias por compartir tu talento con nosotros',
            content: '¡Hola! Queremos agradecerte por tu tiempo e interés y enviarte un gran mensaje de aliento 💪. Has demostrado tener un perfil muy interesante, sin embargo, en esta ocasión hemos decidido avanzar con otros candidatos que se ajustan un poco más al momento actual de esta vacante. No te desanimes, conservaremos tus datos y nos pondremos en contacto contigo para futuras oportunidades. ¡Mucho éxito en tu camino profesional! 🌟',
            type: 'reject'
        };
    } else if (estado === 'Entrevista') {
        msg = {
            title: '¡Avanzamos al siguiente nivel!',
            content: 'Tu perfil ha impresionado a nuestro equipo y queremos conocerte mejor. Revisa tu correo para los detalles de la entrevista.',
            type: 'success'
        };
    } else if (estado === 'Preseleccionado') {
        msg = {
            title: '¡Buenas noticias!',
            content: 'Tu perfil ha sido preseleccionado y se encuentra en etapa de pruebas técnicas. Estás un paso más cerca de unirte a DISCOL.',
            type: 'info'
        };
    } else if (estado === 'En Revisión') {
        msg = {
            title: 'Perfil en Revisión',
            content: 'Nuestro equipo de Gestión Humana está evaluando cuidadosamente tu postulación en una primera entrevista o revisión de perfil.',
            type: 'neutral'
        };
    } else if (estado === 'Oferta') {
        msg = {
            title: '¡Casi es oficial! 🌟',
            content: 'Nos encanta tu perfil y queremos hacerte una oferta. Pronto nuestro equipo se pondrá en contacto contigo para los detalles de vinculación.',
            type: 'success'
        };
    } else {
        msg = {
            title: 'Proceso en Marcha',
            content: 'Nuestro equipo de Gestión Humana ha recibido tu perfil y pronto comenzará a evaluarlo según los parámetros definidos para el cargo.',
            type: 'neutral'
        };
    }

    // Build timeline
    const timeline: TimelineEvent[] = STATES.map((s, i) => ({
        estado: s,
        fecha: i === 0
            ? app.fecha_postulacion || ''
            : (i <= stateIndex && estado !== 'Descartado' && estado !== 'Rechazado' ? (app.fecha_ultima_actualizacion || '') : ''),
        mensaje: (estado === 'Descartado' || estado === 'Rechazado')
                 ? (i === 0 ? 'Postulación finalizada' : 'Cancelado')
                 : (i <= stateIndex ? `Completado` : 'Pendiente'),
        completed: (estado === 'Descartado' || estado === 'Rechazado') 
                   ? (i === 0) 
                   : (stateIndex >= 0 && i <= stateIndex)
    }));


    return {
        application: {
            id: app.id,
            nombre: app.nombre || 'Candidato',
            estado,
            fecha_postulacion: app.fecha_postulacion || new Date().toISOString(),
            fecha_ultima_actualizacion: app.fecha_ultima_actualizacion,
            auto_match_score: app.auto_match_score || 0,
            calificacion_tecnica: app.calificacion_tecnica,
            resultado_final: app.resultado_final,
            etapa_seguimiento: app.etapa_seguimiento,
            estado_entrevista: app.estado_entrevista,
            fecha_entrevista: app.fecha_entrevista,
            motivo_no_apto: app.motivo_no_apto
        },
        vacancy: {
            puesto_nombre: vac.puesto_nombre || 'Vacante',
            codigo_requisicion: vac.codigo_requisicion,
            ubicacion: vac.ubicacion || 'Cartagena, Colombia',
            modalidad_trabajo: vac.modalidad_trabajo || 'Presencial',
            empresa_nombre: vac.empresa_nombre || 'DISCOL S.A.S.'
        },
        timeline,
        progress,
        message: msg
    };
}

const WHATSAPP_NUMBER = '573107285296';

const CandidateTrackingPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProcessedData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleWhatsApp = () => {
        const nombre = data?.application?.nombre || 'Candidato';
        const vacante = data?.vacancy?.puesto_nombre || 'Vacante';
        const estado = data?.application?.estado || 'En proceso';
        const fecha = data?.application?.fecha_postulacion
            ? new Date(data.application.fecha_postulacion).toLocaleDateString('es-CO')
            : '';

        const mensaje =
            `Hola DISCOL 👋, soy *${nombre}* y tengo una consulta sobre mi postulación.\n\n` +
            `📋 *Vacante:* ${vacante}\n` +
            `🔄 *Estado actual:* ${estado}\n` +
            (fecha ? `📅 *Fecha postulación:* ${fecha}\n` : '') +
            `\n¿Podrían ayudarme con información sobre mi proceso? 🙏`;

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/tracking/${token}`);
                
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.error || 'Link de tracking inválido o expirado');
                }

                const apiData = await res.json();
                console.log('[Tracking] API Response:', apiData);

                if (!apiData.success) {
                    throw new Error(apiData.error || 'No se pudo obtener el estado');
                }

                const processed = processApiData(apiData);
                setData(processed);
            } catch (err: any) {
                console.error('[Tracking] Error:', err);
                setError(err.message || 'No pudimos cargar el estado de tu postulación. Verifica el link o intenta más tarde.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchStatus();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-blue-400 animate-pulse" size={20} />
                    </div>
                </div>
                <p className="mt-6 text-slate-400 font-medium animate-pulse">Obteniendo estado de tu proceso...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">¡Ups! Algo salió mal</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-[#055098] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20">
                        <ArrowLeft size={18} /> Volver al Inicio
                    </Link>
                </div>
            </div>
        );
    }

    const { application, vacancy, timeline, progress, message } = data;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 text-blue-400 font-bold tracking-wider uppercase text-xs mb-3">
                            <Shield size={14} className="animate-pulse" />
                            Tracking de Postulación Oficial
                            {vacancy.codigo_requisicion && (
                                <span className="ml-2 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md text-[10px]">
                                    REQ: {vacancy.codigo_requisicion}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            {vacancy.puesto_nombre}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-slate-400">
                            <div className="flex items-center gap-2 py-1 px-3 bg-white/5 rounded-full border border-white/10 text-sm">
                                <Briefcase size={14} /> {vacancy.empresa_nombre}
                            </div>
                            <div className="flex items-center gap-2 py-1 px-3 bg-white/5 rounded-full border border-white/10 text-sm">
                                <MapPin size={14} /> {vacancy.ubicacion || 'Cartagena, Colombia'}
                            </div>
                            <div className="flex items-center gap-2 py-1 px-3 bg-white/5 rounded-full border border-white/10 text-sm">
                                <Calendar size={14} /> Postulado el {new Date(application.fecha_postulacion).toLocaleDateString('es-CO')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Dashboard Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Progress and Message */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Status Message Card */}
                        <div className={`relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 border shadow-2xl ${
                            message.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/20' :
                            message.type === 'reject' ? 'bg-slate-900/40 border-slate-700' :
                            'bg-blue-900/10 border-blue-500/20 shadow-blue-500/5'
                        }`}>
                            {message.type === 'success' && <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>}
                            
                            <div className="flex items-start gap-6 relative z-10">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                                    message.type === 'success' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' :
                                    message.type === 'reject' ? 'bg-slate-700' :
                                    'bg-[#055098] shadow-lg shadow-blue-500/40'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle2 className="text-white" size={32} /> :
                                     message.type === 'reject' ? <Heart className="text-white/60" size={32} /> :
                                     <Clock className="text-white" size={32} />}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                        {message.title}
                                    </h3>
                                    <p className="text-slate-400 text-lg leading-relaxed italic">
                                        "{message.content}"
                                    </p>
                                </div>
                            </div>

                            {/* Main Progress Bar */}
                            <div className="mt-12 space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Progreso del Proceso</span>
                                    <span className={`text-2xl font-black ${
                                        message.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                                            message.type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                            message.type === 'reject' ? 'bg-slate-600' :
                                            'bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Metrics Panel */}
                        <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Search size={20} className="text-blue-400" />
                                Detalle de Calificación
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/[0.07] transition-all">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Compatibilidad Perfil</div>
                                    <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                        {application.auto_match_score}<span className="text-lg font-medium text-slate-500">%</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${application.auto_match_score}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/[0.07] transition-all">
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Evaluación Técnica</div>
                                    <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                        {application.calificacion_tecnica || '---' }<span className="text-lg font-medium text-slate-500">/ 5.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-4 leading-normal italic">
                                        Asignada por el equipo técnico durante la revisión
                                    </p>
                                </div>
                            </div>

                            {/* Etapa de seguimiento del reclutador */}
                            {application.etapa_seguimiento && (
                                <div className="mt-6 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-4">
                                    <Shield size={18} className="text-blue-400 shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">Etapa Interna</div>
                                        <div className="text-white font-bold mt-1">{application.etapa_seguimiento}</div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                                <h5 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-widest">Observación del Reclutador</h5>
                                <p className="text-slate-400 leading-relaxed">
                                    {application.resultado_final || "Tu perfil está siendo procesado bajo los lineamientos de Gestión Humana. Mantente atento a las actualizaciones de estado en esta página."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timeline */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-xl sticky top-8">
                            <h4 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                                <FileText size={20} className="text-blue-400" />
                                Historial del Proceso
                            </h4>
                            <div className="space-y-10">
                                {timeline.map((item, idx) => (
                                    <div key={idx} className="relative pl-10 group">
                                        {/* Connector Line */}
                                        {idx < timeline.length - 1 && (
                                            <div className={`absolute left-4 top-8 bottom-[-2.5rem] w-0.5 ${
                                                item.completed ? 'bg-blue-500' : 'bg-white/10'
                                            }`}></div>
                                        )}
                                        
                                        {/* Indicator Circle */}
                                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${
                                            item.completed 
                                                ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/40 text-white' 
                                                : 'bg-slate-900 border-white/10 text-slate-600'
                                        }`}>
                                            {item.completed ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-700"></div>}
                                        </div>

                                        <div className="space-y-1">
                                            <div className={`text-sm font-bold tracking-wide uppercase ${
                                                item.completed ? 'text-white' : 'text-slate-500'
                                            }`}>
                                                {item.estado}
                                            </div>
                                            {item.fecha && (
                                                <div className="text-[10px] text-blue-400/60 font-medium">
                                                    {new Date(item.fecha).toLocaleDateString('es-CO')}
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 leading-relaxed mt-1">
                                                {item.mensaje}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5">
                                <button
                                    onClick={handleWhatsApp}
                                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366]/60 rounded-2xl text-sm font-bold transition-all duration-300 group text-white hover:text-[#25D366] hover:scale-[1.02] active:scale-100"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-[18px] h-[18px] text-[#25D366] group-hover:scale-110 transition-transform"
                                    >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.52 5.845L0 24l6.338-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.372l-.36-.213-3.732.879.939-3.63-.234-.373A9.819 9.819 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                    </svg>
                                    ¿Necesitas ayuda?
                                </button>
                                <p className="text-[10px] text-center text-slate-600 mt-4 leading-relaxed uppercase tracking-widest font-bold">
                                    Derechos Reservados &copy; {new Date().getFullYear()} DISCOL S.A.S.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Back Link */}
                <div className="mt-16 flex justify-center">
                    <Link to="/" className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Volver a las vacantes de DISCOL
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CandidateTrackingPage;

