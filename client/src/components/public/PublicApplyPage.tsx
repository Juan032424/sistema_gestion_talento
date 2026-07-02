import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Briefcase, MapPin, Calendar, DollarSign, Clock,
    CheckCircle2, AlertCircle, Send, ChevronRight,
    Shield, FileText, Globe, Loader2
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
    // 1. Datos Generales
    tipo_identificacion: string;
    cedula: string;
    lugar_expedicion: string;
    fecha_expedicion: string;
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    email: string;
    telefono: string;
    direccion: string;
    fecha_nacimiento: string;
    departamento_residencia: string;
    ciudad_residencia: string;
    nivel_educativo: string;
    mensaje: string;
    como_se_entero: string;
    acepta_terminos: boolean;
    cv_file: File | null;


    // 2. Información Personal
    grupo_etnico: string;
    genero: string;
    estado_civil: string;
    tiene_familiar: string;
    parentesco_familiar: string;
    nombre_familiar: string;
    cedula_familiar: string;
    telefono_familiar: string;
    tipo_vivienda: string;
    servicios_publicos: string[];
    estrato: string;
    tipo_vehiculo: string;
    vehiculo_placa: string;
    vehiculo_marca_modelo: string;
    vehiculo_modelo_ano: string;
    vehiculo_nombre_propietario: string;
    vehiculo_cedula_propietario: string;
    departamento_expedicion: string;
    ciudad_expedicion: string;

    // 3. Información Académica
    tiene_tarjeta_profesional: string;
    numero_tarjeta_profesional: string;
    formaciones: AcademicFormation[];

    // 4. Historial Laboral
    historial_laboral: LaborHistory[];

    // 5. Información Familiar
    tiene_hijos: string;
    cantidad_hijos: string;
    cabeza_familia: string;
    discapacidad: string;

    // 6. Herramientas
    dispuesto_celular: string;
    casco_integral: string;
    ano_matricula_moto: string;
}

interface LaborHistory {
    empresa: string;
    cargo: string;
    anos_exp: string;
    meses_exp: string;
    motivo_retiro: string;
    jefe_inmediato: string;
    telefono_laboral: string;
}

interface AcademicFormation {
    nivel: string;
    entidad: string;
    titulo: string;
    estado: string;
    semestres: string;
    fecha_final: string;
}
const NIVELES_EDUCATIVOS = [
    'Primaria (Incompleta)', 'Primaria (Completa)',
    'Bachillerato (Incompleto)', 'Bachillerato (Completo)',
    'Técnico (Incompleto)', 'Técnico (Completo)',
    'Tecnólogo (Incompleto)', 'Tecnólogo (Completo)',
    'Universitario (Incompleto)', 'Universitario (Completo)',
    'Especialización (Incompleta)', 'Especialización (Completa)',
    'Maestría (Incompleta)', 'Maestría (Completa)',
    'Doctorado (Incompleto)', 'Doctorado (Completo)'
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

const TIPOS_IDENTIFICACION = ['Cedula', 'Cedula Extrajeria', 'Tarjeta Identidad'];
const GRUPOS_ETNICOS = ['Afrocolombiano', 'Palenquero', 'Indígena', 'Caucásico', 'Raizal', 'Mestizo', 'Ninguno'];
const GENEROS = ['Hombre', 'Mujer', 'Otro'];
const ESTADOS_CIVILES = ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Separados', 'Unión Libre'];
const TIPOS_VIVIENDA = ['Propia', 'Arrendada', 'Familiar', 'Otra'];
const SERVICIOS_PUBLICOS_OPCIONES = ['Energía', 'Agua', 'Gas', 'Internet'];
const ESTRATOS = ['1', '2', '3', '4', '5', 'Comercial'];
const TIPOS_VEHICULOS = ['No tengo', 'Moto', 'Carro', 'Bicicleta'];

const PublicApplyPage: React.FC = () => {
    const { vacanteId } = useParams<{ vacanteId: string }>();
    const [vacancy, setVacancy] = useState<VacancyPublic | null>(null);
    const [loadingVacancy, setLoadingVacancy] = useState(true);
    const [vacancyError, setVacancyError] = useState('');
    const { theme } = useTheme();

    const [step, setStep] = useState<number>(1);

    const [form, setForm] = useState<ApplicationForm>({
        // Datos generales
        tipo_identificacion: '',
        cedula: '',
        lugar_expedicion: '',
        fecha_expedicion: '',
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        fecha_nacimiento: '',
        departamento_residencia: '',
        ciudad_residencia: '',
        nivel_educativo: '',
        mensaje: '',
        como_se_entero: '',
        acepta_terminos: false,
        cv_file: null,

        // Información personal
        grupo_etnico: '',
        genero: '',
        estado_civil: '',
        tiene_familiar: '',
        parentesco_familiar: '',
        nombre_familiar: '',
        telefono_familiar: '',
        tipo_vivienda: '',
        servicios_publicos: [],
        estrato: '',
        tipo_vehiculo: 'No tengo',
        vehiculo_placa: '',
        vehiculo_marca_modelo: '',
        vehiculo_modelo_ano: '',
        vehiculo_nombre_propietario: '',
        vehiculo_cedula_propietario: '',

        // Academic info
        tiene_tarjeta_profesional: '',
        numero_tarjeta_profesional: '',
        formaciones: [
            { nivel: '', entidad: '', titulo: '', estado: '', semestres: '', fecha_final: '' }
        ],

        // Step 4
        historial_laboral: [
            { empresa: '', cargo: '', anos_exp: '0', meses_exp: '0', motivo_retiro: '', jefe_inmediato: '', telefono_laboral: '' }
        ],
        tiene_hijos: 'No',
        cantidad_hijos: '0',
        cabeza_familia: 'No',
        discapacidad: 'No tengo',
        dispuesto_celular: 'No',
        casco_integral: 'No',
        ano_matricula_moto: '',
        cedula_familiar: '',
        departamento_expedicion: '',
        ciudad_expedicion: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [errors, setErrors] = useState<any>({});

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [savedData, setSavedData] = useState<{ form: ApplicationForm; step: number } | null>(null);
    const [hasCheckedSavedData, setHasCheckedSavedData] = useState(false);

    const [duplicateError, setDuplicateError] = useState<{ message: string, cedula: string } | null>(null);
    const [recovering, setRecovering] = useState(false);
    const [recoverSuccess, setRecoverSuccess] = useState('');

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

    const ciudadesExpedicion = React.useMemo(() => {
        if (!form.departamento_expedicion) return [];
        try {
            return colombiaUtils.getCitiesByDepartment(form.departamento_expedicion).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            return [];
        }
    }, [form.departamento_expedicion]);

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

    useEffect(() => {
        if (!vacanteId) return;
        const saved = localStorage.getItem(`discol_apply_form_${vacanteId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.form && parsed.step) {
                    setSavedData(parsed);
                    setShowResumeModal(true);
                }
            } catch (e) {
                console.error("Error parsing saved form", e);
            }
        }
        setHasCheckedSavedData(true);
    }, [vacanteId]);

    useEffect(() => {
        if (!hasCheckedSavedData || showResumeModal || submitted || !vacanteId) return;

        const formToSave = { ...form, cv_file: null };
        const dataToSave = { form: formToSave, step };

        const handler = setTimeout(() => {
            localStorage.setItem(`discol_apply_form_${vacanteId}`, JSON.stringify(dataToSave));
        }, 800);

        return () => clearTimeout(handler);
    }, [form, step, vacanteId, submitted, showResumeModal, hasCheckedSavedData]);

    const validateStep1 = (): boolean => {
        const newErrors: any = {};
        
        // Validation from old Step 1
        if (!form.tipo_identificacion) newErrors.tipo_identificacion = 'Requerido';
        if (!form.cedula.trim()) newErrors.cedula = 'Requerido';
        if (!form.departamento_expedicion) newErrors.departamento_expedicion = 'Requerido';
        if (!form.ciudad_expedicion) newErrors.ciudad_expedicion = 'Requerido';
        if (!form.fecha_expedicion) newErrors.fecha_expedicion = 'Requerido';
        if (!form.primer_nombre.trim()) newErrors.primer_nombre = 'Requerido';
        if (!form.primer_apellido.trim()) newErrors.primer_apellido = 'Requerido';
        if (!form.segundo_apellido.trim()) newErrors.segundo_apellido = 'Requerido';
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Email inválido';
        if (!form.telefono.trim() || form.telefono.length < 7) newErrors.telefono = 'Teléfono inválido';
        if (!form.direccion.trim()) newErrors.direccion = 'Requerido';
        if (!form.fecha_nacimiento) newErrors.fecha_nacimiento = 'Requerido';
        if (!form.departamento_residencia) newErrors.departamento_residencia = 'Requerido';
        if (!form.ciudad_residencia) newErrors.ciudad_residencia = 'Requerido';
        if (!form.como_se_entero) newErrors.como_se_entero = 'Requerido';
        if (!form.acepta_terminos) newErrors.acepta_terminos = 'Debes aceptar';
        if (!form.cv_file) newErrors.cv_file = 'Debe adjuntar su CV en PDF';

        // Validation from old Step 2
        if (!form.grupo_etnico) newErrors.grupo_etnico = 'Requerido';
        if (!form.genero) newErrors.genero = 'Requerido';
        if (!form.estado_civil) newErrors.estado_civil = 'Requerido';
        if (!form.tiene_familiar) newErrors.tiene_familiar = 'Requerido';
        if (form.tiene_familiar === 'Si') {
            if (!form.parentesco_familiar) newErrors.parentesco_familiar = 'Requerido';
            if (!form.nombre_familiar) newErrors.nombre_familiar = 'Requerido';
            if (!form.cedula_familiar) newErrors.cedula_familiar = 'Requerido';
            if (form.cedula_familiar && form.cedula_familiar.trim() === form.cedula.trim()) {
                newErrors.cedula_familiar = 'No puedes colocar tu misma cédula';
            }
        }
        if (!form.tipo_vivienda) newErrors.tipo_vivienda = 'Requerido';
        if (form.servicios_publicos.length === 0) newErrors.servicios_publicos = 'Requerido';
        if (!form.estrato) newErrors.estrato = 'Requerido';
        if (!form.tipo_vehiculo) newErrors.tipo_vehiculo = 'Requerido';
        if (form.tipo_vehiculo === 'Moto' || form.tipo_vehiculo === 'Carro') {
            if (!form.vehiculo_placa) newErrors.vehiculo_placa = 'Requerido';
            if (!form.vehiculo_marca_modelo) newErrors.vehiculo_marca_modelo = 'Requerido';
            if (!form.vehiculo_modelo_ano) newErrors.vehiculo_modelo_ano = 'Requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: any = {};
        if (!form.nivel_educativo) newErrors.nivel_educativo = 'Requerido'; 
        if (!form.tiene_tarjeta_profesional) newErrors.tiene_tarjeta_profesional = 'Requerido';
        if (form.tiene_tarjeta_profesional === 'Si' && !form.numero_tarjeta_profesional) {
            newErrors.numero_tarjeta_profesional = 'Requerido';
        }
        
        const hasValidFormation = form.formaciones.some(f => f.nivel && f.entidad);
        if (!hasValidFormation) {
            newErrors.formaciones = 'Debe agregar al menos una formación académica';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const newErrors: any = {};
        if (!form.tiene_hijos) newErrors.tiene_hijos = 'Requerido';
        if (!form.cabeza_familia) newErrors.cabeza_familia = 'Requerido';
        if (!form.discapacidad) newErrors.discapacidad = 'Requerido';

        if (form.tipo_vehiculo === 'Carro' || form.tipo_vehiculo === 'Moto') {
            if (!form.dispuesto_celular) newErrors.dispuesto_celular = 'Requerido';
            if (form.tipo_vehiculo === 'Moto') {
                if (!form.casco_integral) newErrors.casco_integral = 'Requerido';
                if (!form.ano_matricula_moto) newErrors.ano_matricula_moto = 'Requerido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (step === 2 && validateStep2()) {
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const validate = (): boolean => {
        if (step === 1) return validateStep1();
        if (step === 2) return validateStep2();
        return validateStep3();
    };

    const handleRecoverLink = async () => {
        if (!duplicateError) return;
        setRecovering(true);
        setSubmitError('');
        try {
            const res = await fetch(`${API_BASE}/apply/${vacanteId}/recover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: duplicateError.cedula })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al recuperar');
            setRecoverSuccess(data.message || 'Enlace enviado al correo registrado.');
        } catch (err: any) {
            setSubmitError(err.message || 'Error al recuperar el enlace');
        } finally {
            setRecovering(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError('');
        setDuplicateError(null);
        setRecoverSuccess('');

        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'cv_file') {
                    if (form.cv_file) formData.append('cv', form.cv_file);
                } else if (key === 'acepta_terminos') {
                    formData.append(key, form.acepta_terminos ? 'true' : 'false');
                } else if (key === 'servicios_publicos' || key === 'formaciones' || key === 'historial_laboral') {
                    formData.append(key, JSON.stringify((form as any)[key]));
                } else {
                    const val = (form as any)[key];
                    // Save "N/A" for family if "No"
                    if (form.tiene_familiar === 'No' && ['parentesco_familiar', 'nombre_familiar', 'telefono_familiar'].includes(key)) {
                        formData.append(key, 'N/A');
                    } else if (['No tengo', 'Bicicleta'].includes(form.tipo_vehiculo) && ['vehiculo_placa', 'vehiculo_marca_modelo', 'vehiculo_modelo_ano', 'vehiculo_nombre_propietario', 'vehiculo_cedula_propietario'].includes(key)) {
                        formData.append(key, 'N/A');
                    } else {
                        formData.append(key, val);
                    }
                }
            });

            const res = await fetch(`${API_BASE}/apply/${vacanteId}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.duplicate) {
                    setDuplicateError({ message: data.error, cedula: data.cedula });
                    setSubmitting(false);
                    return;
                }
                throw new Error(data.error || 'Error en el servidor');
            }

            setTrackingUrl(data.trackingUrl || '');
            setSubmitted(true);
            localStorage.removeItem(`discol_apply_form_${vacanteId}`);
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
                {label} {required && <span className="text-blue-400">*</span>}
            </label>
            {children || (
                <input
                    type={type}
                    value={form[name] as string}
                    onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 transition-all ${errors[name]
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : 'border-white/10 hover:border-white/20 focus:ring-blue-500/30 focus:border-blue-500/40'}`}
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
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
                        El equipo de Gestión Humana de <span className="text-blue-400 font-bold">DISCOL S.A.S.</span> revisará tu perfil y se pondrá en contacto contigo si eres seleccionado/a para continuar el proceso.
                    </p>

                    {trackingUrl && (
                        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="bg-blue-600/10 border border-blue-500/30 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                                
                                <h3 className="text-xl md:text-2xl font-black text-white mb-4 relative z-10">
                                    ¡Sigue tu proceso en tiempo real! 🚀
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base mb-8 relative z-10 leading-relaxed">
                                    Hemos generado un link único para que puedas visualizar el estado de tu postulación y los parámetros de calificación en cualquier momento.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                                    <a 
                                        href={trackingUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-3 bg-[#055098] hover:bg-blue-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 group/btn"
                                    >
                                        VER MI POSTULACIÓN
                                        <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(trackingUrl);
                                            alert('¡Link copiado al portapapeles!');
                                        }}
                                        className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-6 py-4 rounded-2xl transition-all"
                                    >
                                        Copiar Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1421] to-blue-950">
            {/* Auto-Save / Resume Modal */}
            {showResumeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0d1421] border border-blue-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-blue-900/20">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30 mx-auto">
                            <FileText size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-2">Recuperar Postulación</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">
                            Hemos detectado que tienes una postulación en curso para esta vacante. ¿Deseas continuar donde lo dejaste o empezar de nuevo?
                            <br /><br />
                            <span className="text-xs text-amber-400 font-bold">Nota: Deberás adjuntar tu CV en PDF nuevamente por seguridad.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    localStorage.removeItem(`discol_apply_form_${vacanteId}`);
                                    setShowResumeModal(false);
                                }}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all border border-white/5"
                            >
                                Empezar de nuevo
                            </button>
                            <button
                                onClick={() => {
                                    if (savedData) {
                                        setForm({ ...savedData.form, cv_file: null });
                                        setStep(savedData.step);
                                    }
                                    setShowResumeModal(false);
                                }}
                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-3">
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
                    <div className="bg-[#0d1421] border border-blue-500/20 rounded-2xl p-6 mb-6 shadow-xl shadow-blue-900/20">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Briefcase size={24} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
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
                                    color: 'text-blue-400'
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
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <FileText size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white">Formulario de Postulación</h2>
                            <p className="text-[10px] text-slate-500">Todos los campos marcados con * son obligatorios</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 1. INFORMACIÓN PERSONAL Y GENERAL */}
                                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 py-1.5 bg-blue-500/10 rounded-lg text-center">1. DATOS PERSONALES Y GENERALES</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                        {renderField("Primer Nombre", "primer_nombre", "text", "", true)}
                                        {renderField("Segundo Nombre", "segundo_nombre", "text", "", false)}
                                        {renderField("Primer Apellido", "primer_apellido", "text", "", true)}
                                        {renderField("Segundo Apellido", "segundo_apellido", "text", "", true)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                        {renderField("Tipo de Identificación", "tipo_identificacion", "text", undefined, true,
                                            (
                                                <select value={form.tipo_identificacion} onChange={e => setForm(f => ({ ...f, tipo_identificacion: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.tipo_identificacion ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-blue-500/30'}`}>
                                                    <option value="">Seleccionar...</option>
                                                    {TIPOS_IDENTIFICACION.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            )
                                        )}
                                        {renderField("Número de Identificación", "cedula", "text", "Ej: 1045...", true)}
                                        {renderField("Fecha de Expedición", "fecha_expedicion", "date", "", true)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {renderField("Departamento Expedición", "departamento_expedicion", "text", undefined, true,
                                            (
                                                <select value={form.departamento_expedicion} onChange={e => setForm(f => ({ ...f, departamento_expedicion: e.target.value, ciudad_expedicion: '', lugar_expedicion: '' }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.departamento_expedicion ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                    <option value="">Seleccionar...</option>
                                                    {departamentos.map((d: any) => (<option key={d.id} value={d.nombre}>{d.nombre}</option>))}
                                                </select>
                                            )
                                        )}
                                        {renderField("Ciudad de Expedición", "ciudad_expedicion", "text", undefined, true,
                                            (
                                                <select value={form.ciudad_expedicion} onChange={e => setForm(f => ({ ...f, ciudad_expedicion: e.target.value, lugar_expedicion: `${form.departamento_expedicion} - ${e.target.value}` }))} disabled={!form.departamento_expedicion} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none ${!form.departamento_expedicion ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${errors.ciudad_expedicion ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                    <option value="">Seleccionar...</option>
                                                    {ciudadesExpedicion.map((c: any, i: number) => (<option key={i} value={c.nombre}>{c.nombre}</option>))}
                                                </select>
                                            )
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                        {renderField("Celular / Teléfono", "telefono", "text", "Ej: 300...", true)}
                                        {renderField("Departamento Residencia", "departamento_residencia", "text", undefined, true,
                                            (
                                                <select value={form.departamento_residencia} onChange={e => setForm(f => ({ ...f, departamento_residencia: e.target.value, ciudad_residencia: '' }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.departamento_residencia ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                    <option value="">Seleccionar...</option>
                                                    {departamentos.map((d: any) => (<option key={d.id} value={d.nombre}>{d.nombre}</option>))}
                                                </select>
                                            )
                                        )}
                                        {renderField("Ciudad Residencia", "ciudad_residencia", "text", undefined, true,
                                            (
                                                <select value={form.ciudad_residencia} onChange={e => setForm(f => ({ ...f, ciudad_residencia: e.target.value }))} disabled={!form.departamento_residencia} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none ${!form.departamento_residencia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${errors.ciudad_residencia ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                    <option value="">Seleccionar...</option>
                                                    {ciudades.map((c: any, i: number) => (<option key={i} value={c.nombre}>{c.nombre}</option>))}
                                                </select>
                                            )
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {renderField("Dirección de Residencia", "direccion", "text", "Ej: Calle 10 # 5-20", true)}
                                        {renderField("Fecha de Nacimiento", "fecha_nacimiento", "date", "", true)}
                                    </div>

                                    <div className="mb-4">
                                        {renderField("Correo Electrónico (Fundamental)", "email", "email", "ejemplo@correo.com", true)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 pt-4 border-t border-white/5">
                                        {renderField("Grupo Étnico", "grupo_etnico", "text", undefined, true, (
                                            <select value={form.grupo_etnico} onChange={e => setForm(f => ({ ...f, grupo_etnico: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.grupo_etnico ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {GRUPOS_ETNICOS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                        {renderField("Género", "genero", "text", undefined, true, (
                                            <select value={form.genero} onChange={e => setForm(f => ({ ...f, genero: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.genero ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {GENEROS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                        {renderField("Estado Civil", "estado_civil", "text", undefined, true, (
                                            <select value={form.estado_civil} onChange={e => setForm(f => ({ ...f, estado_civil: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.estado_civil ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {ESTADOS_CIVILES.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                    </div>

                                    <div className="mb-4">
                                    <h3 className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">¿Algún familiar trabajando en la empresa? <span className="text-blue-400">*</span></h3>
                                        <div className="flex gap-6 mt-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={form.tiene_familiar === 'Si'} onChange={() => setForm(f => ({ ...f, tiene_familiar: 'Si' }))} className="text-blue-600 focus:ring-blue-500/30" />
                                                <span className="text-sm text-slate-300 font-bold">Sí</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={form.tiene_familiar === 'No'} onChange={() => setForm(f => ({ ...f, tiene_familiar: 'No', parentesco_familiar: '', nombre_familiar: '', telefono_familiar: '', cedula_familiar: '' }))} className="text-blue-600 focus:ring-blue-500/30" />
                                                <span className="text-sm text-slate-300 font-bold">No</span>
                                            </label>
                                        </div>
                                    </div>

                                    {form.tiene_familiar === 'Si' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 border border-blue-500/20 bg-blue-500/5 rounded-xl">
                                            {renderField("Parentesco", "parentesco_familiar", "text", "Ej: Hermano", true)}
                                            {renderField("Cédula", "cedula_familiar", "text", "", true)}
                                            {renderField("Nombre", "nombre_familiar", "text", "", true)}
                                            {renderField("Teléfono", "telefono_familiar", "text", "", false)}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                        {renderField("Vivienda", "tipo_vivienda", "text", undefined, true, (
                                            <select value={form.tipo_vivienda} onChange={e => setForm(f => ({ ...f, tipo_vivienda: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.tipo_vivienda ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {TIPOS_VIVIENDA.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                        {renderField("Estrato", "estrato", "text", undefined, true, (
                                            <select value={form.estrato} onChange={e => setForm(f => ({ ...f, estrato: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.estrato ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {ESTRATOS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                        {renderField("Servicios", "servicios_publicos", "text", undefined, true, (
                                            <div className="flex flex-wrap gap-2">
                                                {SERVICIOS_PUBLICOS_OPCIONES.map(s => (
                                                    <label key={s} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${form.servicios_publicos.includes(s) ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400'}`}>
                                                        <input type="checkbox" checked={form.servicios_publicos.includes(s)} onChange={e => {
                                                                const newVal = e.target.checked ? [...form.servicios_publicos, s] : form.servicios_publicos.filter(v => v !== s);
                                                                setForm(f => ({ ...f, servicios_publicos: newVal }));
                                                            }} className="sr-only" />
                                                        <span className="text-[9px] font-black uppercase">{s}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mb-4">
                                        {renderField("Tipo de Vehículo", "tipo_vehiculo", "text", undefined, true, (
                                            <div className="flex flex-wrap gap-4">
                                                {TIPOS_VEHICULOS.map(t => (
                                                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                                                        <input type="radio" value={t} checked={form.tipo_vehiculo === t} onChange={ev => setForm(f => ({ ...f, tipo_vehiculo: ev.target.value, vehiculo_placa: '', vehiculo_marca_modelo: '', vehiculo_modelo_ano: '', vehiculo_nombre_propietario: '', vehiculo_cedula_propietario: '' }))} />
                                                        <span className="text-xs text-slate-300 font-bold">{t}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {(form.tipo_vehiculo === 'Moto' || form.tipo_vehiculo === 'Carro') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 border border-blue-500/20 bg-blue-500/5 rounded-xl">
                                            {renderField("Placa", "vehiculo_placa", "text", "", true)}
                                            {renderField("Marca/Modelo", "vehiculo_marca_modelo", "text", "", true)}
                                            {renderField("Año", "vehiculo_modelo_ano", "text", "", true)}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">REFERENCIA Y ADJUNTOS</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        {renderField("¿Cómo se enteró de la vacante?", "como_se_entero", "text", undefined, true, (
                                            <select value={form.como_se_entero} onChange={e => setForm(f => ({ ...f, como_se_entero: e.target.value }))} className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${errors.como_se_entero ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}>
                                                <option value="">Seleccionar...</option>
                                                {COMO_SE_ENTERO.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Adjuntar Hoja de Vida (PDF) <span className="text-blue-400">*</span></label>
                                            <div className="relative">
                                                <input type="file" accept=".pdf,application/pdf" onChange={e => {
                                                    const file = e.target.files ? e.target.files[0] : null;
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            setErrors((prev: any) => ({ ...prev, cv_file: 'El archivo supera el límite máximo de 5MB.' }));
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                                                            setErrors((prev: any) => ({ ...prev, cv_file: 'Solo se permiten archivos en formato PDF.' }));
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setErrors((prev: any) => {
                                                            const newErrs = { ...prev };
                                                            delete newErrs.cv_file;
                                                            return newErrs;
                                                        });
                                                    }
                                                    setForm(f => ({ ...f, cv_file: file }));
                                                }} className="sr-only" id="cv_upload" />
                                                <label htmlFor="cv_upload" className={`w-full flex items-center justify-between bg-slate-900 border rounded-xl px-4 py-3 cursor-pointer transition-all hover:bg-slate-800 ${errors.cv_file ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}>
                                                    <span className="text-sm text-slate-400 truncate max-w-[180px]">{form.cv_file ? form.cv_file.name : 'Seleccionar archivo PDF...'}</span>
                                                    <FileText size={18} className="text-blue-400 shrink-0" />
                                                </label>
                                            </div>
                                            {errors.cv_file && <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-bold"><AlertCircle size={10} /> {errors.cv_file as any}</p>}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={form.acepta_terminos} onChange={e => setForm(f => ({ ...f, acepta_terminos: e.target.checked }))} className={`mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 text-blue-600 focus:ring-blue-500/40 transition-all ${errors.acepta_terminos ? 'border-red-500' : ''}`} />
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-300 font-medium group-hover:text-white transition-colors">Acepto el tratamiento de mis datos personales según la Ley 1581 de 2012 y las políticas de la empresa <span className="text-blue-400 font-black">DISCOL S.A.S.</span></p>
                                                {errors.acepta_terminos && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-tight">Debes aceptar los términos para continuar</p>}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <button type="button" onClick={handleNextStep} className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-white/10 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 mt-4">
                                    CONTINUAR A INFORMACIÓN ACADÉMICA
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-bold text-slate-400 hover:text-white mb-4 flex items-center gap-1">
                                        Volver a Información Personal
                                    </button>
                                    
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 mb-6">
                                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 text-center py-2 bg-blue-500/10 rounded-lg">2. INFORMACIÓN ACADÉMICA</h3>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                            {renderField("Nivel Académico (Obligatorio)", "nivel_educativo", "text", undefined, true, (
                                                <select
                                                    value={form.nivel_educativo}
                                                    onChange={e => setForm(f => ({ ...f, nivel_educativo: e.target.value }))}
                                                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${errors.nivel_educativo ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:ring-indigo-500/30'}`}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {NIVELES_EDUCATIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ))}
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">¿Tiene Tarjeta Profesional? *</label>
                                                <div className="flex gap-6 mt-1">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="radio" value="Si" checked={form.tiene_tarjeta_profesional === 'Si'} onChange={() => setForm(f => ({ ...f, tiene_tarjeta_profesional: 'Si' }))} className="w-4 h-4 text-blue-600 bg-slate-900 border-white/10 focus:ring-blue-500/30" />
                                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Sí</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="radio" value="No" checked={form.tiene_tarjeta_profesional === 'No'} onChange={() => setForm(f => ({ ...f, tiene_tarjeta_profesional: 'No', numero_tarjeta_profesional: '' }))} className="w-4 h-4 text-blue-600 bg-slate-900 border-white/10 focus:ring-blue-500/30" />
                                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">No</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {form.tiene_tarjeta_profesional === 'Si' && (
                                                renderField("Número Tarjeta Profesional", "numero_tarjeta_profesional", "text", "Ej: 12345...", true)
                                            )}
                                        </div>

                                        {/* Lista de formaciones */}
                                        <div className="mt-8 border-t border-white/5 pt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Lista de Formaciones Académicas *</p>
                                                    <p className="text-[10px] text-slate-500 italic">Registre su historial académico comenzando por el nivel más reciente.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, formaciones: [...f.formaciones, { nivel: '', entidad: '', titulo: '', estado: '', semestres: '', fecha_final: '' }] }))}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-lg shadow-blue-600/20"
                                                >
                                                    <span className="text-sm">+</span> Agregar fila
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {form.formaciones.map((formacion, index) => (
                                                    <div key={index} className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl relative group hover:border-blue-500/30 transition-all">
                                                        {form.formaciones.length > 1 && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setForm(f => ({ ...f, formaciones: f.formaciones.filter((_, i) => i !== index) }))}
                                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow-xl"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Nivel Académico</label>
                                                                <input 
                                                                    value={formacion.nivel} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].nivel = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all" 
                                                                    placeholder="Ej: Técnico"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Nombre Entidad</label>
                                                                <input 
                                                                    value={formacion.entidad} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].entidad = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all" 
                                                                    placeholder="Ej: SENA"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Título o Carrera</label>
                                                                <input 
                                                                    value={formacion.titulo} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].titulo = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all" 
                                                                    placeholder="Ej: Contabilidad"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Estado del Estudio</label>
                                                                <input 
                                                                    value={formacion.estado} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].estado = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all" 
                                                                    placeholder="Ej: Finalizado"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Semestres</label>
                                                                <input 
                                                                    value={formacion.semestres} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].semestres = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all" 
                                                                    placeholder="Ej: 6 cursados"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Fecha de Finalización</label>
                                                                <input 
                                                                    type="date"
                                                                    value={formacion.fecha_final} 
                                                                    onChange={e => {
                                                                        const newList = [...form.formaciones];
                                                                        newList[index].fecha_final = e.target.value;
                                                                        setForm(f => ({ ...f, formaciones: newList }));
                                                                    }}
                                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all [color-scheme:dark]" 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {errors.formaciones && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">⚠️ {errors.formaciones}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error message */}
                                    {submitError && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 flex items-start gap-2 animate-pulse">
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-400">{submitError}</p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-white/10 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 mt-8"
                                    >
                                        PROCEDA PARA LA FINALIZACIÓN DEL PROCESO
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <button type="button" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-bold text-slate-400 hover:text-white mb-0 mt-2 flex items-center gap-1">
                                    Volver a Información Académica
                                </button>
                                
                                {/* 3. HISTORIAL LABORAL, FAMILIAR Y HERRAMIENTAS */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 text-center py-2 bg-slate-500/10 rounded-lg">3. HISTORIAL LABORAL Y FAMILIAR</h3>
                                    
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Empresas en las que ha laborado</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, historial_laboral: [...f.historial_laboral, { empresa: '', cargo: '', anos_exp: '0', meses_exp: '0', motivo_retiro: '', jefe_inmediato: '', telefono_laboral: '' }] }))}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/30 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border border-blue-500/30"
                                        >
                                            <span className="text-sm">+</span> Agregar experiencia
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {form.historial_laboral.map((lab, index) => (
                                            <div key={index} className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl relative group">
                                                {form.historial_laboral.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setForm(f => ({ ...f, historial_laboral: f.historial_laboral.filter((_, i) => i !== index) }))}
                                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nombre Empresa</label>
                                                        <input 
                                                            value={lab.empresa} 
                                                            onChange={e => { const nl = [...form.historial_laboral]; nl[index].empresa = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }}
                                                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" placeholder="Ej: DISCOL SAS"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nombre Cargo</label>
                                                        <input 
                                                            value={lab.cargo} 
                                                            onChange={e => { const nl = [...form.historial_laboral]; nl[index].cargo = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }}
                                                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" placeholder="Ej: Operario"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tiempo de Experiencia</label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <select 
                                                                    value={lab.anos_exp} 
                                                                    onChange={e => { const nl = [...form.historial_laboral]; nl[index].anos_exp = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-2 py-2.5 text-[10px] text-white"
                                                                >
                                                                    {[...Array(21)].map((_, i) => <option key={i} value={i}>{i} Años</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1">
                                                                <select 
                                                                    value={lab.meses_exp} 
                                                                    onChange={e => { const nl = [...form.historial_laboral]; nl[index].meses_exp = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-2 py-2.5 text-[10px] text-white"
                                                                >
                                                                    {[...Array(12)].map((_, i) => <option key={i} value={i}>{i} Meses</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Motivo Retiro</label>
                                                        <input value={lab.motivo_retiro} onChange={e => { const nl = [...form.historial_laboral]; nl[index].motivo_retiro = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Jefe Inmediato</label>
                                                        <input value={lab.jefe_inmediato} onChange={e => { const nl = [...form.historial_laboral]; nl[index].jefe_inmediato = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Teléfono</label>
                                                        <input value={lab.telefono_laboral} onChange={e => { const nl = [...form.historial_laboral]; nl[index].telefono_laboral = e.target.value; setForm(f => ({ ...f, historial_laboral: nl })); }} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. INFORMACIÓN FAMILIAR */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 mt-6 text-center py-2 bg-slate-500/10 rounded-lg">4. INFORMACIÓN FAMILIAR</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">¿Tiene Hijos? *</label>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" checked={form.tiene_hijos === 'Si'} onChange={() => setForm(f => ({ ...f, tiene_hijos: 'Si' }))} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Sí</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" checked={form.tiene_hijos === 'No'} onChange={() => setForm(f => ({ ...f, tiene_hijos: 'No', cantidad_hijos: '0', cabeza_familia: 'No' }))} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">No</span>
                                                </label>
                                            </div>
                                        </div>

                                        {form.tiene_hijos === 'Si' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Cantidad de Hijos *</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {['1', '2', '3', '4', '5', '6+'].map(c => (
                                                        <label key={c} className={`p-2 rounded-lg border text-center text-xs font-black cursor-pointer transition-all ${form.cantidad_hijos === c ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                                                            <input type="radio" className="hidden" checked={form.cantidad_hijos === c} onChange={() => setForm(f => ({ ...f, cantidad_hijos: c }))} />
                                                            {c}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">¿Es usted cabeza de Familia? *</label>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" checked={form.cabeza_familia === 'Si'} onChange={() => setForm(f => ({ ...f, cabeza_familia: 'Si' }))} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Sí</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" checked={form.cabeza_familia === 'No'} onChange={() => setForm(f => ({ ...f, cabeza_familia: 'No' }))} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">No</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">¿Presenta alguna discapacidad? *</label>
                                            <div className="space-y-2">
                                                {['No tengo', 'Discapacidad física', 'Discapacidad sensorial', 'Discapacidad intelectual', 'Discapacidad psicosocial', 'Discapacidad múltiple'].map(d => (
                                                    <label key={d} className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="radio" checked={form.discapacidad === d} onChange={() => setForm(f => ({ ...f, discapacidad: d }))} className="text-blue-600" />
                                                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{d}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* HERRAMIENTAS */}
                                {(form.tipo_vehiculo === 'Carro' || form.tipo_vehiculo === 'Moto') && (
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">HERRAMIENTAS</h3>
                                        <p className="text-[10px] text-slate-500 mb-6 italic">Responda las siguientes preguntas previas antes de cargar su perfil:</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-300 mb-3 leading-tight">1. ¿Está dispuesto(a) a utilizar su celular personal en calidad de alquiler para desempeñar sus labores? *</label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={form.dispuesto_celular === 'Si'} onChange={() => setForm(f => ({ ...f, dispuesto_celular: 'Si' }))} /> <span className="text-xs text-slate-400">Si</span></label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={form.dispuesto_celular === 'No'} onChange={() => setForm(f => ({ ...f, dispuesto_celular: 'No' }))} /> <span className="text-xs text-slate-400">No</span></label>
                                                </div>
                                            </div>

                                            {form.tipo_vehiculo === 'Moto' && (
                                                <>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-300 mb-3 leading-tight">2. ¿Cuenta usted con casco integral para motociclista con al menos 4 estrellas SHARP y certificado? *</label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={form.casco_integral === 'Si'} onChange={() => setForm(f => ({ ...f, casco_integral: 'Si' }))} /> <span className="text-xs text-slate-400">Si</span></label>
                                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={form.casco_integral === 'No'} onChange={() => setForm(f => ({ ...f, casco_integral: 'No' }))} /> <span className="text-xs text-slate-400">No</span></label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-300 mb-3 leading-tight">3. Seleccione el año de matrícula de su motocicleta *</label>
                                                        <select value={form.ano_matricula_moto} onChange={ev => setForm(f => ({ ...f, ano_matricula_moto: ev.target.value }))} className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white">
                                                            <option value="">Seleccionar año...</option>
                                                            {[...Array(26)].map((_, i) => { const y = (2026 - i).toString(); return <option key={y} value={y}>{y}</option>; })}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    {submitError && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 flex items-start gap-2 animate-pulse">
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-400">{submitError}</p>
                                        </div>
                                    )}

                                    {duplicateError && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-200 leading-relaxed">{duplicateError.message}</p>
                                            </div>
                                            {!recoverSuccess ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRecoverLink}
                                                    disabled={recovering}
                                                    className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all border border-amber-500/30 flex items-center justify-center gap-2"
                                                >
                                                    {recovering ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    {recovering ? 'Recuperando...' : 'Enviar enlace a mi correo'}
                                                </button>
                                            ) : (
                                                <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                                    <span className="text-[11px] text-emerald-400 font-bold uppercase">{recoverSuccess}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full py-4 bg-gradient-to-r from-blue-600 to-[#055098] hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Procesando Postulación...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Enviar Postulación Final
                                                <ChevronRight size={16} />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-[10px] text-slate-600 mt-6 pb-8">
                                        🔒 Tus datos viajan cifrados y son almacenados de forma segura bajo la Ley 1581 de 2012
                                    </p>
                                </div>
                            </div>
                        )}
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

