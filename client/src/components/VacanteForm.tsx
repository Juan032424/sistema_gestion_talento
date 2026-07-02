import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import {
    ChevronLeft,
    Info,
    CreditCard,
    Calendar,
    MapPin,
    Hash,
    Tag,
    Briefcase,
    PieChart,
    Settings,
    Clock,
    Users,
    Zap,
    DollarSign,
    AlertCircle,
    CloudOff
} from 'lucide-react';
import { SectionHeader, PremiumInput, PremiumSelect } from './ui/PremiumComponents';
import { WizardProgress, WizardNavigation, FieldError, type WizardStep } from './ui/FormWizard';
import { useToast } from './ToastNotification';
import { cn } from '../lib/utils';

const DRAFT_KEY = 'vacante_form_draft';

// â”€â”€â”€ Validation Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type FormData = ReturnType<typeof getInitialForm>;
type Errors = Partial<Record<keyof FormData, string>>;

function getInitialForm() {
    return {
        codigo_requisicion: '',
        puesto_nombre: '',
        proceso_id: '',
        sede_id: '',
        proyecto_id: '',
        centro_costo_id: '',
        subcentro_id: '',
        tipo_trabajo_id: '',
        tipo_proyecto_id: '',
        fecha_apertura: '',
        fecha_cierre_estimada: '',
        prioridad: 'Media',
        responsable_rh: '',
        salario_base: '',
        presupuesto_aprobado: '',
        costo_vacante: '',
        observaciones: '',
        dias_sla_meta: '15',
        salario_base_ofrecido: '',
        costo_final_contratacion: '',
        costo_dia_vacante: '',
        presupuesto_max: '',
        salario_pactado: '',
        costo_examenes_medicos: '',
        periodo: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        estado: 'Abierta',
        fecha_cierre_real: '',
        cantidad: 1,
    };
}

function validate(data: FormData, step: number): Errors {
    const errors: Errors = {};

    if (step === 0) {
        if (!data.puesto_nombre.trim()) errors.puesto_nombre = 'El nombre del puesto es obligatorio.';
        if (!data.periodo.trim()) errors.periodo = 'El período es obligatorio.';
        if (!data.codigo_requisicion.trim()) errors.codigo_requisicion = 'El código de requisición es obligatorio.';
    }
    if (step === 1) {
        if (!data.proceso_id) errors.proceso_id = 'Selecciona un proceso.';
        if (!data.sede_id) errors.sede_id = 'Selecciona una sede.';
        if (!data.fecha_apertura) errors.fecha_apertura = 'La fecha de apertura es obligatoria.';
        if (!data.fecha_cierre_estimada) errors.fecha_cierre_estimada = 'La fecha de cierre estimada es obligatoria.';
        if (data.fecha_apertura && data.fecha_cierre_estimada && data.fecha_cierre_estimada <= data.fecha_apertura) {
            errors.fecha_cierre_estimada = 'El cierre estimado debe ser posterior a la apertura.';
        }
    }
    if (step === 2) {
        // Financial step - optional but validated if filled
        if (data.presupuesto_aprobado && data.presupuesto_max) {
            if (Number(data.presupuesto_aprobado) > Number(data.presupuesto_max)) {
                errors.presupuesto_aprobado = 'El presupuesto aprobado no puede superar el máximo.';
            }
        }
        if (data.salario_base_ofrecido && data.salario_pactado) {
            if (Number(data.salario_pactado) > Number(data.salario_base_ofrecido) * 1.5) {
                errors.salario_pactado = 'El salario pactado parece demasiado alto en relación al ofrecido.';
            }
        }
    }
    return errors;
}

function isStepValid(data: FormData, step: number): boolean {
    return Object.keys(validate(data, step)).length === 0;
}

// ——— WIZARD STEPS DEFINITION —————————————————————————————————————————————————
const STEPS: WizardStep[] = [
    { id: 0, title: 'Identificación', description: 'Puesto y código', icon: <Hash /> },
    { id: 1, title: 'Logística', description: 'Sede, fechas y proceso', icon: <MapPin /> },
    { id: 2, title: 'Costos', description: 'Presupuesto y salarios', icon: <DollarSign /> },
    { id: 3, title: 'Confirmación', description: 'Revisar y guardar', icon: <Briefcase /> },
];

// ——— COMPONENT ———————————————————————————————————————————————————————————————
const VacanteForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const { theme } = useTheme();
    const { showToast } = useToast();

    // Catalog state
    const [sedes, setSedes] = useState<any[]>([]);
    const [procesos, setProcesos] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [centros, setCentros] = useState<any[]>([]);
    const [subcentros, setSubcentros] = useState<any[]>([]);
    const [tiposTrabajo, setTiposTrabajo] = useState<any[]>([]);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
    const [reclutadores, setReclutadores] = useState<any[]>([]);

    const [formData, setFormData] = useState<FormData>(getInitialForm());
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [isDraft, setIsDraft] = useState(false);
    const [loading, setLoading] = useState(true);

    // Live errors (only shown for touched fields)
    const allErrors = validate(formData, currentStep);
    const visibleErrors: Errors = {};
    touched.forEach(k => {
        if (allErrors[k as keyof FormData]) {
            visibleErrors[k as keyof FormData] = allErrors[k as keyof FormData];
        }
    });

    // ——— Auto-save to localStorage (only for new forms) ——————————————————————
    const saveDraft = useCallback((data: FormData) => {
        if (!isEditing) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: currentStep, savedAt: new Date().toISOString() }));
            setIsDraft(true);
        }
    }, [isEditing, currentStep]);

    // Debounced draft save
    useEffect(() => {
        if (isEditing || loading) return;
        const timer = setTimeout(() => saveDraft(formData), 800);
        return () => clearTimeout(timer);
    }, [formData, isEditing, loading, saveDraft]);

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setIsDraft(false);
        setFormData(getInitialForm());
        setCurrentStep(0);
        setTouched(new Set());
        showToast('Borrador eliminado', 'info' as any);
    };

    // ——— Load catalogs + vacante (if editing) —————————————————————————————————
    useEffect(() => {
        const loadData = async () => {
            try {
                const configRes = await api.get('/config/config-data');
                const data = configRes.data;
                setSedes(data.sedes);
                setProcesos(data.procesos);
                setProyectos(data.proyectos);
                setCentros(data.centros);
                setSubcentros(data.subcentros);
                setTiposTrabajo(data.tiposTrabajo);
                setTiposProyecto(data.tiposProyecto);

                try {
                    const recRes = await api.get('/users/recruiters');
                    setReclutadores(recRes.data);
                } catch { /* non-critical */ }

                if (isEditing) {
                    const vacanteRes = await api.get(`/vacantes/${id}`);
                    const v = vacanteRes.data;
                    setFormData({
                        ...getInitialForm(),
                        ...v,
                        proceso_id: v.proceso_id?.toString() || '',
                        sede_id: v.sede_id?.toString() || '',
                        proyecto_id: v.proyecto_id?.toString() || '',
                        centro_costo_id: v.centro_costo_id?.toString() || '',
                        subcentro_id: v.subcentro_id?.toString() || '',
                        tipo_trabajo_id: v.tipo_trabajo_id?.toString() || '',
                        tipo_proyecto_id: v.tipo_proyecto_id?.toString() || '',
                        fecha_apertura: v.fecha_apertura ? v.fecha_apertura.substring(0, 10) : '',
                        fecha_cierre_estimada: v.fecha_cierre_estimada ? v.fecha_cierre_estimada.substring(0, 10) : '',
                        fecha_cierre_real: v.fecha_cierre_real ? v.fecha_cierre_real.substring(0, 10) : '',
                        periodo: v.periodo || `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`
                    });
                } else {
                    // Try to restore draft
                    const raw = localStorage.getItem(DRAFT_KEY);
                    if (raw) {
                        try {
                            const { data: draftData, step } = JSON.parse(raw);
                            setFormData(prev => ({ ...prev, ...draftData }));
                            setCurrentStep(step || 0);
                            setIsDraft(true);
                            showToast('📋 Borrador restaurado', 'success' as any);
                        } catch { localStorage.removeItem(DRAFT_KEY); }
                    } else {
                        // Fetch next code
                        try {
                            const codeRes = await api.get('/vacantes/next-code');
                            setFormData(prev => ({
                                ...prev,
                                codigo_requisicion: codeRes.data.nextCode,
                                sede_id: data.sedes[0]?.id.toString() || '',
                                proceso_id: data.procesos[0]?.id.toString() || '',
                                proyecto_id: data.proyectos[0]?.id.toString() || '',
                                centro_costo_id: data.centros[0]?.id.toString() || '',
                                subcentro_id: data.subcentros[0]?.id.toString() || '',
                                tipo_trabajo_id: data.tiposTrabajo[0]?.id.toString() || '',
                                tipo_proyecto_id: data.tiposProyecto[0]?.id.toString() || '',
                            }));
                        } catch { /* next-code non-critical */ }
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                showToast('Error cargando datos del formulario', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => new Set(prev).add(name));
    };

    const handleNext = () => {
        // Mark all current-step fields as touched
        const stepFields = getStepFields(currentStep);
        setTouched(prev => {
            const next = new Set(prev);
            stepFields.forEach(f => next.add(f));
            return next;
        });
        if (!isStepValid(formData, currentStep)) return;
        setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = () => {
        setCurrentStep(s => Math.max(s - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/vacantes/${id}`, formData);
                showToast('Vacante actualizada con éxito', 'success');
            } else {
                await api.post('/vacantes', formData);
                localStorage.removeItem(DRAFT_KEY);
                showToast('Vacante creada con éxito ✓', 'success');
            }
            setTimeout(() => navigate('/vacantes'), 1000);
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Error al guardar vacante.', 'error');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-32 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />
                <div className="h-96 bg-white/5 rounded-3xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-semibold mb-6 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Volver al listado
            </button>

            {/* Header card */}
            <div className="bg-[#161b22] border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 p-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {isEditing ? `Editar Vacante: ${formData.codigo_requisicion}` : 'Nueva Requisición de Talento'}
                        </h2>
                        <p className="text-white/70 text-sm mt-1 font-medium">
                            {isEditing ? 'Modifica los datos de la vacante' : 'Completa los 4 pasos para registrar la vacante'}
                        </p>
                    </div>
                    <div
                        className="w-20 h-20 rounded-xl p-2 shadow-lg hidden sm:block rotate-3 hover:rotate-6 transition-transform duration-500"
                        style={{ backgroundColor: theme === 'light' ? '#fff' : '#000' }}
                    >
                        <img src={theme === 'light' ? '/logo_discol_light.png' : '/logo_discol.png'} alt="Logo" className="w-full h-full object-contain scale-125" />
                    </div>
                </div>

                {/* Draft badge */}
                {isDraft && !isEditing && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-3 flex items-center gap-3">
                        <CloudOff size={14} className="text-amber-400" />
                        <p className="text-amber-400 text-[11px] font-bold">Borrador guardado automáticamente — puedes cerrar esta pestaña con seguridad</p>
                    </div>
                )}

                {/* Wizard progress */}
                {!isEditing && (
                    <div className="px-8 pt-2 pb-0 border-b border-white/5 bg-[#0d1117]/40">
                        <WizardProgress
                            steps={STEPS}
                            currentStep={currentStep}
                            onStepClick={(s) => { if (s < currentStep) setCurrentStep(s); }}
                        />
                    </div>
                )}

                {/* Form body */}
                <div className="p-8 space-y-8">
                    {/* ── STEP 0: IDENTIFICACIÓN ───────────────────────────── */}
                    {(isEditing || currentStep === 0) && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SectionHeader icon={<Hash />} title="Identificación del Puesto" color="text-indigo-400" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <PremiumInput
                                        label="Código Requisición"
                                        name="codigo_requisicion"
                                        value={formData.codigo_requisicion}
                                        onChange={handleChange}
                                        icon={<Hash size={16} />}
                                        disabled={isEditing}
                                        required
                                    />
                                    <FieldError message={visibleErrors.codigo_requisicion || ''} />
                                </div>
                                <div>
                                    <PremiumInput
                                        label="Posición / Puesto"
                                        name="puesto_nombre"
                                        value={formData.puesto_nombre}
                                        onChange={handleChange}
                                        icon={<Tag size={16} />}
                                        required
                                    />
                                    <FieldError message={visibleErrors.puesto_nombre || ''} />
                                </div>
                                <div>
                                    <PremiumInput
                                        label="Período"
                                        name="periodo"
                                        value={formData.periodo}
                                        onChange={handleChange}
                                        icon={<Calendar size={16} />}
                                        required
                                    />
                                    <FieldError message={visibleErrors.periodo || ''} />
                                </div>
                                {!isEditing && (
                                    <div>
                                        <PremiumInput
                                            label="Cantidad de Vacantes"
                                            name="cantidad"
                                            type="number"
                                            value={formData.cantidad}
                                            onChange={handleChange}
                                            min="1"
                                            max="10"
                                            icon={<Users size={16} />}
                                            required
                                        />
                                    </div>
                                )}
                                {isEditing && (
                                    <PremiumSelect
                                        label="Estado Actual"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Abierta', label: '🟢 Abierta' },
                                            { value: 'En Proceso', label: '🔵 En Proceso' },
                                            { value: 'Cubierta', label: '🟣 Cubierta' },
                                            { value: 'Cancelada', label: '⚫ Cancelada' },
                                            { value: 'Suspendida', label: '🟠 Suspendida' }
                                        ]}
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    {/* â”€â”€ STEP 1: LOGÃSTICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {(isEditing || currentStep === 1) && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isEditing && <div className="border-t border-white/5 pt-8" />}
                            <SectionHeader icon={<MapPin />} title="LogÃ­stica: UbicaciÃ³n, Proyecto y Fechas" color="text-emerald-400" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <PremiumSelect
                                        label="Sede Principal"
                                        name="sede_id"
                                        value={formData.sede_id}
                                        onChange={handleChange}
                                        icon={<MapPin size={16} />}
                                        options={sedes.map(s => ({ value: s.id, label: s.nombre }))}
                                    />
                                    <FieldError message={visibleErrors.sede_id || ''} />
                                </div>
                                <div>
                                    <PremiumSelect
                                        label="Proceso"
                                        name="proceso_id"
                                        value={formData.proceso_id}
                                        onChange={handleChange}
                                        icon={<Info size={16} />}
                                        options={procesos.map(p => ({ value: p.id, label: p.nombre }))}
                                    />
                                    <FieldError message={visibleErrors.proceso_id || ''} />
                                </div>
                                <PremiumInput
                                    label="Días SLA Meta"
                                    name="dias_sla_meta"
                                    type="number"
                                    value={formData.dias_sla_meta}
                                    onChange={handleChange}
                                    icon={<Clock size={16} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <PremiumInput
                                        label="Fecha de Apertura"
                                        name="fecha_apertura"
                                        type="date"
                                        value={formData.fecha_apertura}
                                        onChange={handleChange}
                                        icon={<Calendar size={16} />}
                                        required
                                    />
                                    <FieldError message={visibleErrors.fecha_apertura || ''} />
                                </div>
                                <div>
                                    <PremiumInput
                                        label="Cierre Estimado"
                                        name="fecha_cierre_estimada"
                                        type="date"
                                        value={formData.fecha_cierre_estimada}
                                        onChange={handleChange}
                                        icon={<Calendar size={16} />}
                                        required
                                    />
                                    <FieldError message={visibleErrors.fecha_cierre_estimada || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <PremiumSelect
                                    label="Proyecto"
                                    name="proyecto_id"
                                    value={formData.proyecto_id}
                                    onChange={handleChange}
                                    options={proyectos.map(p => ({ value: p.id, label: p.nombre }))}
                                />
                                <PremiumSelect
                                    label="Tipo de Proyecto"
                                    name="tipo_proyecto_id"
                                    value={formData.tipo_proyecto_id}
                                    onChange={handleChange}
                                    options={tiposProyecto.map(p => ({ value: p.id, label: `${p.codigo} - ${p.nombre}` }))}
                                />
                                <PremiumSelect
                                    label="Tipo de Trabajo"
                                    name="tipo_trabajo_id"
                                    value={formData.tipo_trabajo_id}
                                    onChange={handleChange}
                                    options={tiposTrabajo.map(t => ({ value: t.id, label: `${t.codigo} - ${t.nombre}` }))}
                                />
                            </div>
                        </section>
                    )}

                    {/* â”€â”€ STEP 2: COSTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {(isEditing || currentStep === 2) && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isEditing && <div className="border-t border-white/5 pt-8" />}
                            <SectionHeader icon={<CreditCard />} title="Estructura de Costos y Finanzas" color="text-amber-400" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PremiumSelect
                                    label="Centro de Costo"
                                    name="centro_costo_id"
                                    value={formData.centro_costo_id}
                                    onChange={handleChange}
                                    icon={<Settings size={16} />}
                                    options={centros.map(c => ({ value: c.id, label: c.nombre }))}
                                />
                                <PremiumSelect
                                    label="Subcentro de Costo"
                                    name="subcentro_id"
                                    value={formData.subcentro_id}
                                    onChange={handleChange}
                                    options={subcentros.map(s => ({ value: s.id, label: s.nombre }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PremiumSelect
                                    label="Prioridad"
                                    name="prioridad"
                                    value={formData.prioridad}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Baja', label: 'Baja' },
                                        { value: 'Media', label: 'Media' },
                                        { value: 'Alta', label: 'Alta' },
                                        { value: 'Crítica', label: 'Crítica' }
                                    ]}
                                />
                                <PremiumSelect
                                    label="Responsable RH"
                                    name="responsable_rh"
                                    value={formData.responsable_rh}
                                    onChange={handleChange}
                                    icon={<Users size={16} />}
                                    options={[{ value: '', label: 'Ninguno' }, ...reclutadores.map(r => ({ value: r.nombre, label: r.nombre }))]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <PremiumInput label="Presupuesto Aprobado ($)" name="presupuesto_aprobado" type="number" value={formData.presupuesto_aprobado} onChange={handleChange} icon={<DollarSign size={16} />} />
                                    <FieldError message={visibleErrors.presupuesto_aprobado || ''} />
                                </div>
                                <PremiumInput label="Presupuesto Máx ($)" name="presupuesto_max" type="number" value={formData.presupuesto_max || ''} onChange={handleChange} icon={<DollarSign size={16} />} />
                                <PremiumInput label="Salario Base ($)" name="salario_base" type="number" value={formData.salario_base} onChange={handleChange} />
                                <PremiumInput label="Salario Ofrecido ($)" name="salario_base_ofrecido" type="number" value={formData.salario_base_ofrecido} onChange={handleChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <PremiumInput label="Salario Pactado ($)" name="salario_pactado" type="number" value={formData.salario_pactado || ''} onChange={handleChange} />
                                    <FieldError message={visibleErrors.salario_pactado || ''} />
                                </div>
                                <PremiumInput label="Costo Final Est. ($)" name="costo_final_contratacion" type="number" value={formData.costo_final_contratacion} onChange={handleChange} />
                                <PremiumInput label="Costo Vacante ($)" name="costo_vacante" type="number" value={formData.costo_vacante} onChange={handleChange} />
                                <PremiumInput label="Costo/Día ($)" name="costo_dia_vacante" type="number" value={formData.costo_dia_vacante || ''} onChange={handleChange} icon={<Zap size={16} className="text-indigo-400" />} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PremiumInput label="Costo Exámenes Médicos ($)" name="costo_examenes_medicos" type="number" value={formData.costo_examenes_medicos || ''} onChange={handleChange} icon={<DollarSign size={16} />} />
                            </div>
                        </section>
                    )}

                    {/* â”€â”€ STEP 3: CONFIRMACIÃ“N / OBSERVACIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {(isEditing || currentStep === 3) && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isEditing && <div className="border-t border-white/5 pt-8" />}

                            {/* Summary card (only in wizard) */}
                            {!isEditing && (
                                <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={16} /> Resumen de la RequisiciÃ³n
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'CÃ³digo', value: formData.codigo_requisicion },
                                            { label: 'Puesto', value: formData.puesto_nombre },
                                            { label: 'Apertura', value: formData.fecha_apertura },
                                            { label: 'Cierre Est.', value: formData.fecha_cierre_estimada },
                                            { label: 'Prioridad', value: formData.prioridad },
                                            { label: 'Responsable', value: formData.responsable_rh || 'â€”' },
                                            { label: 'Presupuesto', value: formData.presupuesto_aprobado ? `$${Number(formData.presupuesto_aprobado).toLocaleString()}` : 'â€”' },
                                            { label: 'SLA Meta', value: `${formData.dias_sla_meta} dÃ­as` },
                                        ].map(item => (
                                            <div key={item.label} className="bg-white/[0.03] rounded-xl p-3">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                                                <p className="text-xs font-bold text-white truncate">{item.value || 'â€”'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                                    Observaciones / Requisitos del perfil
                                </label>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    className="w-full bg-[#0d1117]/70 border-2 border-white/5 rounded-2xl p-6 text-sm text-white focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] outline-none transition-all duration-300 resize-none h-36"
                                    placeholder="Detalla los requisitos técnicos, habilidades blandas y motivaciones para esta vacante..."
                                    onChange={handleChange}
                                />
                            </div>

                            {/* AI Widget */}
                            <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Escaneo Autónomo de IA</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Activar Sourcing Agent para esta vacante</p>
                                    </div>
                                </div>
                                <button type="button" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
                                    Activar Agente
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Navigation */}
                    {isEditing ? (
                        <div className="flex justify-end gap-6 pt-6 border-t border-white/5">
                            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl">
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={cn(
                                    "relative overflow-hidden group px-12 py-4 rounded-xl font-bold text-white shadow-2xl transition-all text-xs uppercase tracking-widest",
                                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all group-hover:scale-110" />
                                <div className="relative flex items-center gap-3">
                                    {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                                    <span>{submitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <WizardNavigation
                            currentStep={currentStep}
                            totalSteps={STEPS.length}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onSubmit={handleSubmit}
                            isSubmitting={submitting}
                            canProceed={isStepValid(formData, currentStep)}
                            isDraft={isDraft}
                            onClearDraft={clearDraft}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

function getStepFields(step: number): string[] {
    switch (step) {
        case 0: return ['codigo_requisicion', 'puesto_nombre', 'periodo'];
        case 1: return ['sede_id', 'proceso_id', 'fecha_apertura', 'fecha_cierre_estimada'];
        case 2: return ['presupuesto_aprobado', 'presupuesto_max', 'salario_pactado'];
        default: return [];
    }
}

export default VacanteForm;
