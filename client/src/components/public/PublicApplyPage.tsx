import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Briefcase, MapPin, Calendar, DollarSign, Clock,
    User, Phone, BookOpen,
    CheckCircle2, AlertCircle, Send, ChevronRight,
    Star, Shield, FileText, Globe, Loader2
} from 'lucide-react';
// @ts-ignore
import * as colombiaUtils from 'colombia-cities';
import { useTheme } from '../../context/ThemeContext';


interface VacancyPublic {
    id: number;
    titulo: string;
    codigo: string;
    descripcion: string | null;
    ciudad: string;
    sede: string;
    tipo_trabajo: string | null;
    proceso: string | null;
    salario: string;
    fecha_cierre: string | null;
    empresa: string;
}

interface ApplicationForm {
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    departamento_residencia: string;
    ciudad_residencia: string;
    nivel_educativo: string;
    anos_experiencia: string;
    cargo_actual: string;
    empresa_actual: string;
    mensaje: string;
    como_se_entero: string;
    acepta_terminos: boolean;
    cv_file: File | null;
}

const NIVELES_EDUCATIVOS = [
    'Bachillerato',
    'Técnico',
    'Tecnólogo',
    'Universitario (En curso)',
    'Universitario (Graduado)',
    'Especialización',
    'Maestría',
    'Doctorado'
];

const COMO_SE_ENTERO = [
    'Redes sociales (Instagram, Facebook)',
    'WhatsApp',
    'Recomendación de un amigo/familiar',
    'LinkedIn',
    'Portal de empleo (Computrabajo, ElEmpleo, Indeed)',
    'Página web DISCOL',
    'Aviso en el establecimiento',
    'Otro'
];

const PublicApplyPage: React.FC = () => {
    const { vacanteId } = useParams<{ vacanteId: string }>();
    const [vacancy, setVacancy] = useState<VacancyPublic | null>(null);
    const [loadingVacancy, setLoadingVacancy] = useState(true);
    const [vacancyError, setVacancyError] = useState('');
    const { theme } = useTheme();

    const [form, setForm] = useState<ApplicationForm>({
        cedula: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        departamento_residencia: '',
        ciudad_residencia: '',
        nivel_educativo: '',
        anos_experiencia: '',
        cargo_actual: '',
        empresa_actual: '',
        mensaje: '',
        como_se_entero: '',
        acepta_terminos: false,
        cv_file: null
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [errors, setErrors] = useState<Partial<ApplicationForm>>({});

    const departamentos = React.useMemo(() => {
        try {
            return colombiaUtils.getDepartments().sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            return [];
        }
    }, []);

    const ciudades = React.useMemo(() => {
        if (!form.departamento_residencia) return [];
        try {
            return colombiaUtils.getCitiesByDepartment(form.departamento_residencia).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            return [];
        }
    }, [form.departamento_residencia]);

    const API_BASE = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        if (!vacanteId) return;
        fetch(`${API_BASE}/apply/${vacanteId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) setVacancyError(data.error);
                else setVacancy(data);
            })
            .catch(() => setVacancyError('No se pudo conectar con el servidor'))
            .finally(() => setLoadingVacancy(false));
    }, [vacanteId]);

    const validate = (): boolean => {
        const newErrors: Partial<ApplicationForm> = {};
        if (!form.cedula.trim()) newErrors.cedula = 'Requerido';
        if (!form.nombres.trim()) newErrors.nombres = 'Requerido';
        if (!form.apellidos.trim()) newErrors.apellidos = 'Requerido';
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Email inválido';
        if (!form.telefono.trim() || form.telefono.length < 7) newErrors.telefono = 'Teléfono inválido';
        if (!form.departamento_residencia) newErrors.departamento_residencia = 'Requerido';
        if (!form.ciudad_residencia) newErrors.ciudad_residencia = 'Requerido';
        if (!form.nivel_educativo) newErrors.nivel_educativo = 'Requerido';
        if (!form.como_se_entero) newErrors.como_se_entero = 'Requerido';
        if (!form.acepta_terminos) newErrors.acepta_terminos = 'Debes aceptar' as any;
        if (!form.cv_file) newErrors.cv_file = 'Debe adjuntar su CV en PDF' as any;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError('');

        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'cv_file') {
                    if (form.cv_file) formData.append('cv', form.cv_file);
                } else if (key === 'acepta_terminos') {
                    formData.append(key, form.acepta_terminos ? 'true' : 'false');
                } else {
                    formData.append(key, (form as any)[key]);
                }
            });

            const res = await fetch(`${API_BASE}/apply/${vacanteId}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error en el servidor');

            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setSubmitError(err.message || 'Error al enviar. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    // ---- FIELD SUB-COMPONENT Extracted to avoid focus loss ----
    const renderField = (
        label: string,
        name: Exclude<keyof ApplicationForm, 'cv_file' | 'acepta_terminos'>,
        type: string = 'text',
        placeholder?: string,
        required: boolean = false,
        children?: React.ReactNode
    ) => (
        <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                {label} {required && <span className="text-indigo-400">*</span>}
            </label>
            {children || (
                <input
                    type={type}
                    value={form[name] as string}
                    onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 transition-all ${errors[name]
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30 focus:border-indigo-500/40'}`}
                />
            )}
            {errors[name] && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errors[name] as string}
                </p>
            )}
        </div>
    );

    // ---- LOADING ----
    if (loadingVacancy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-indigo-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Cargando vacante...</p>
                </div>
            </div>
        );
    }

    // ---- ERROR ----
    if (vacancyError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-indigo-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white mb-2">Vacante no disponible</h2>
                    <p className="text-slate-400 text-sm">{vacancyError}</p>
                    <p className="text-slate-600 text-xs mt-4">
                        Esta vacante puede haber sido cubierta o ya no está activa.
                    </p>
                </div>
            </div>
        );
    }

    // ---- SUCCESS ----
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-indigo-950 flex items-center justify-center p-4">
                <div className="max-w-lg w-full text-center">
                    {/* Success animation */}
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">
                        ¡Postulación Enviada! 🎉
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Tu postulación para <span className="text-white font-bold">{vacancy?.titulo}</span> fue recibida exitosamente.
                        El equipo de Gestión Humana de <span className="text-indigo-400 font-bold">DISCOL S.A.S.</span> revisará tu perfil y se pondrá en contacto contigo si eres seleccionado/a para continuar el proceso.
                    </p>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left mb-6">
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Próximos pasos:</p>
                        <div className="space-y-2">
                            {['Revisión de tu perfil (1-3 días hábiles)', 'Contacto telefónico o por email', 'Entrevista con el equipo de GH', 'Evaluaciones (según el cargo)'].map((step, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px] font-black text-emerald-400">{i + 1}</div>
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-slate-600 text-xs">
                        📧 Revisa tu bandeja de entrada incluyendo la carpeta de spam.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-indigo-950">
            {/* Top bar */}
            <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={theme === 'light' ? "/logo_discol_light.png" : "/logo_discol.png"} alt="DISCOL S.A.S." className="h-4 object-contain" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Shield size={11} className="text-emerald-400" />
                        <span>Datos protegidos · Ley 1581/2012</span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Vacancy Header */}
                {vacancy && (
                    <div className="bg-[#0d1421] border border-indigo-500/20 rounded-2xl p-6 mb-6 shadow-xl shadow-indigo-900/20">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Briefcase size={24} className="text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {vacancy.codigo}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                        ● Activa
                                    </span>
                                </div>
                                <h1 className="text-2xl font-black text-white">{vacancy.titulo}</h1>
                                <p className="text-sm text-slate-400 mt-0.5 font-medium">{vacancy.empresa}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/5">
                            {[
                                { icon: <MapPin size={13} />, label: vacancy.ciudad || 'Cartagena', color: 'text-blue-400' },
                                { icon: <DollarSign size={13} />, label: vacancy.salario, color: 'text-emerald-400' },
                                { icon: <Clock size={13} />, label: vacancy.tipo_trabajo || 'Tiempo completo', color: 'text-amber-400' },
                                {
                                    icon: <Calendar size={13} />,
                                    label: vacancy.fecha_cierre ? `Cierra: ${new Date(vacancy.fecha_cierre).toLocaleDateString('es-CO')}` : 'Sin fecha límite',
                                    color: 'text-purple-400'
                                },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-1.5 text-xs font-bold ${item.color}`}>
                                    {item.icon}
                                    <span className="text-slate-300">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {vacancy.descripcion && (
                            <div className="mt-4 text-sm text-slate-400 leading-relaxed bg-white/3 rounded-xl p-4 border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Descripción del cargo</p>
                                {vacancy.descripcion}
                            </div>
                        )}
                    </div>
                )}

                {/* APPLICATION FORM */}
                <div className="bg-[#0d1421] border border-white/8 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <FileText size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white">Formulario de Postulación</h2>
                            <p className="text-[10px] text-slate-500">Todos los campos marcados con * son obligatorios</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Datos personales */}
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <User size={10} />
                                Datos Personales
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {renderField("Cédula / Documento de Identidad", "cedula", "text", "Ej: 1045678912", true)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField("Nombres", "nombres", "text", "Ej: Juan Carlos", true)}
                                {renderField("Apellidos", "apellidos", "text", "Ej: Pérez García", true)}
                            </div>

                        </div>

                        {/* Contacto */}
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Phone size={10} />
                                Información de Contacto
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField("Correo Electrónico", "email", "email", "tucorreo@gmail.com", true)}
                                {renderField("Teléfono / Celular", "telefono", "tel", "300 000 0000", true)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {renderField("Departamento de Residencia", "departamento_residencia", "text", undefined, true,
                                    (
                                        <select
                                            value={form.departamento_residencia}
                                            onChange={e => setForm(f => ({ ...f, departamento_residencia: e.target.value, ciudad_residencia: '' }))}
                                            className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${errors.departamento_residencia ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {departamentos.map((d: any) => (
                                                <option key={d.id} value={d.nombre}>{d.nombre}</option>
                                            ))}
                                        </select>
                                    )
                                )}
                                {renderField("Ciudad de Residencia", "ciudad_residencia", "text", undefined, true,
                                    (
                                        <select
                                            value={form.ciudad_residencia}
                                            onChange={e => setForm(f => ({ ...f, ciudad_residencia: e.target.value }))}
                                            disabled={!form.departamento_residencia}
                                            className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${!form.departamento_residencia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${errors.ciudad_residencia ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {ciudades.map((c: any, i: number) => (
                                                <option key={i} value={c.nombre}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Perfil profesional */}
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <BookOpen size={10} />
                                Perfil Profesional
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField("Nivel Educativo", "nivel_educativo", "text", undefined, true,
                                    (
                                        <div className="relative">
                                            <select
                                                value={form.nivel_educativo}
                                                onChange={e => setForm(f => ({ ...f, nivel_educativo: e.target.value }))}
                                                className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${errors.nivel_educativo ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {NIVELES_EDUCATIVOS.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    )
                                )}
                                {renderField("Años de Experiencia", "anos_experiencia", "number", "Ej: 3")}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {renderField("Cargo Actual / Último Cargo", "cargo_actual", "text", "Ej: Auxiliar Contable")}
                                {renderField("Empresa Actual / Última Empresa", "empresa_actual", "text", "Ej: Empresa XYZ")}
                            </div>
                        </div>

                        {/* Carta presentación */}
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Star size={10} />
                                ¿Por qué quieres este cargo?
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                                    Mensaje / Carta de presentación breve <span className="text-slate-600">(opcional)</span>
                                </label>
                                <textarea
                                    value={form.mensaje}
                                    onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                                    placeholder="Cuéntanos brevemente por qué eres la persona ideal para este cargo, qué te motiva y qué habilidades aportarías al equipo..."
                                    rows={4}
                                    maxLength={800}
                                    className="w-full bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                                />
                                <p className="text-right text-[10px] text-slate-600 mt-1">{form.mensaje.length}/800</p>
                            </div>
                        </div>

                        {/* Adjuntar CV */}
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <FileText size={10} />
                                Hoja de Vida (CV)
                            </p>
                            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${errors.cv_file ? 'border-red-500/50 bg-red-500/5' : 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 hover:bg-indigo-500/10'}`}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    id="cv_upload"
                                    className="hidden"
                                    onChange={e => setForm(f => ({ ...f, cv_file: e.target.files ? e.target.files[0] : null }))}
                                />
                                <label htmlFor="cv_upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <FileText className={`w-8 h-8 ${form.cv_file ? 'text-indigo-400' : 'text-slate-400'}`} />
                                    {form.cv_file ? (
                                        <div className="text-sm text-indigo-300 font-medium break-all px-4">
                                            {form.cv_file.name}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-bold text-white">Click para subir tu Hoja de Vida</span>
                                            <span className="text-xs text-slate-500">Solo se permiten archivos en formato PDF</span>
                                        </>
                                    )}
                                </label>
                            </div>
                            {errors.cv_file && (
                                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    {errors.cv_file as unknown as string}
                                </p>
                            )}
                        </div>

                        {/* ¿Cómo se enteró? */}
                        <div>
                            {renderField("¿Cómo te enteraste de esta vacante?", "como_se_entero", "text", undefined, true,
                                (
                                    <div className="relative">
                                        <select
                                            value={form.como_se_entero}
                                            onChange={e => setForm(f => ({ ...f, como_se_entero: e.target.value }))}
                                            className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${errors.como_se_entero ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {COMO_SE_ENTERO.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Términos y condiciones */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex-shrink-0 mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={form.acepta_terminos}
                                        onChange={e => setForm(f => ({ ...f, acepta_terminos: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.acepta_terminos
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : errors.acepta_terminos ? 'border-red-500' : 'border-white/20 group-hover:border-white/40'
                                        }`}>
                                        {form.acepta_terminos && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    <span className="text-white font-bold">Autorizo el tratamiento de mis datos personales</span>
                                    {' '}por parte de DISCOL S.A.S., de acuerdo con la{' '}
                                    <span className="text-indigo-400 font-bold">Ley 1581 de 2012</span> de Protección de Datos Personales de Colombia,
                                    con el fin exclusivo de gestionar mi proceso de selección.
                                    Mis datos serán almacenados de forma segura y no serán compartidos con terceros. *
                                </p>
                            </label>
                            {errors.acepta_terminos && (
                                <p className="mt-2 text-xs text-red-400 ml-8">Debes aceptar el tratamiento de datos para continuar</p>
                            )}
                        </div>

                        {/* Error message */}
                        {submitError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400">{submitError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enviando postulación...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviar Postulación
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] text-slate-600">
                            🔒 Tus datos viajan cifrados y son almacenados de forma segura
                        </p>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 space-y-1">
                    <p className="text-xs text-slate-600">© 2026 DISCOL S.A.S. · Cartagena, Colombia</p>
                    <p className="text-[10px] text-slate-700 flex items-center justify-center gap-1">
                        <Globe size={9} />
                        Plataforma de Gestión Humana — GH-SCORE PRO
                    </p>
                </div>
            </div >
        </div >
    );
};

export default PublicApplyPage;
