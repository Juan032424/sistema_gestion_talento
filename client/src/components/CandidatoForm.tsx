import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import {
    ChevronLeft,
    Save,
    User,
    Briefcase,
    FileText,
    Calendar,
    CheckCircle2,
    Linkedin,
    DollarSign,
    Zap,
    Bot,
    Book,
    Users,
    Truck,
    Smartphone,
    Info,
    Shield,
    X,
    MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SectionHeader, PremiumInput, PremiumSelect } from './ui/PremiumComponents';
import ActivityLogViewer from './ActivityLogViewer';
import AuditTimeline from './AuditTimeline';
import { History, ShieldCheck } from 'lucide-react';

const CandidatoForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [vacantes, setVacantes] = useState<any[]>([]);
    const { theme } = useTheme();
    const [showRatingFields, setShowRatingFields] = useState(false);

    const [formData, setFormData] = useState({
        nombre_candidato: '',
        vacante_id: '',
        etapa_actual: 'Postulación',
        fuente_reclutamiento: 'LinkedIn',
        salario_pretendido: '',
        cv_url: '',
        estado_entrevista: 'Pendiente',
        fecha_entrevista: '',
        resultado_candidato: '',
        motivo_no_apto: '',
        calificacion_tecnica: '', // 0-5
        estatus_90_dias: '',
        resultado_final: '',
        score_tecnico_ia: '',
        resumen_ia_entrevista: '',
        // Campos adicionales del portal público
        cedula: '',
        tipo_identificacion: '',
        email: '',
        telefono: '',
        ciudad: '',
        primer_apellido: '',
        segundo_apellido: '',
        segundo_nombre: '',
        lugar_expedicion: '',
        fecha_expedicion: '',
        direccion: '',
        fecha_nacimiento: '',
        grupo_etnico: '',
        genero: '',
        estado_civil: '',
        tiene_familiar: '',
        parentesco_familiar: '',
        nombre_familiar: '',
        telefono_familiar: '',
        tipo_vivienda: '',
        servicios_publicos: '[]',
        estrato: '',
        tipo_vehiculo: '',
        vehiculo_placa: '',
        vehiculo_marca_modelo: '',
        vehiculo_modelo_ano: '',
        vehiculo_nombre_propietario: '',
        vehiculo_cedula_propietario: '',
        tiene_tarjeta_profesional: '',
        numero_tarjeta_profesional: '',
        formacion_academica: '[]',
        historial_laboral: '[]',
        tiene_hijos: '',
        cantidad_hijos: 0,
        cabeza_familia: '',
        discapacidad: '',
        dispuesto_celular: '',
        casco_integral: '',
        ano_matricula_moto: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load vacancies for dropdown
                const vacRes = await api.get('/vacantes');
                setVacantes(vacRes.data);

                if (isEditing) {
                    const res = await api.get(`/candidatos/${id}`);
                    const c = res.data;
                    setFormData({
                        ...c,
                        vacante_id: c.vacante_id?.toString() || '',
                        fecha_entrevista: c.fecha_entrevista ? c.fecha_entrevista.substring(0, 10) : '',
                        salario_pretendido: c.salario_pretendido || '',
                        calificacion_tecnica: c.calificacion_tecnica || ''
                    });
                }
            } catch (error) {
                console.error("Error loading candidate data", error);
            }
        };
        loadData();
    }, [id, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/candidatos/${id}`, formData);
            } else {
                await api.post('/candidatos', formData);
            }
            navigate('/candidatos');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al guardar candidato.');
        }
    };

    return (
        <div className={cn(
            "mx-auto transition-all duration-500",
            isEditing && formData.cv_url ? "max-w-[98%] px-2" : "max-w-4xl"
        )}>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-semibold mb-8 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Volver al listado
            </button>

            <div className={cn(
                "flex flex-col lg:flex-row gap-6 mb-20",
                isEditing && formData.cv_url ? "items-stretch" : "items-start"
            )}>
                {/* PDF VIEWER PANEL (LEFT SIDE ON SPLIT VIEW) */}
                {isEditing && formData.cv_url && (
                    <div className="lg:w-1/2 flex flex-col bg-slate-800 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-left-4 duration-700">
                        <div className="bg-slate-900 border-b border-white/5 p-6 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><FileText size={20} /></div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Visor de Hoja de Vida</h3>
                                    <p className="text-[10px] text-slate-500 font-mono mt-1.5 truncate max-w-[200px]">{formData.cv_url}</p>
                                </div>
                            </div>
                            <a
                                href={formData.cv_url}
                                download
                                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95"
                            >
                                Descargar
                            </a>
                        </div>
                        <div className="flex-1 bg-slate-950 p-1 min-h-[600px] lg:h-[calc(100vh-180px)] sticky top-24">
                            <iframe
                                src={formData.cv_url}
                                className="w-full h-full rounded-2xl border-0"
                                title="CV Preview"
                            />
                        </div>
                    </div>
                )}

                {/* FORM PANEL */}
                <div className={cn(
                    "bg-slate-800 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500",
                    isEditing && formData.cv_url ? "lg:w-1/2" : "w-full"
                )}>
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {isEditing ? `Editar Candidato: ${formData.nombre_candidato}` : 'Registrar Nuevo Candidato'}
                            </h2>
                            <p className="text-white/70 text-sm mt-1 font-medium">Gestión integral del proceso de selección</p>
                        </div>
                        <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg hidden sm:block rotate-3 hover:rotate-6 transition-transform duration-500" style={{ backgroundColor: theme === 'light' ? '#fff' : '#000' }}>
                            <img src={theme === 'light' ? "/logo_discol_light.png" : "/logo_discol.png"} alt="Logo" className="w-full h-full object-contain scale-125" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-12">
                    {/* SECCIÓN 1: DATOS PERSONALES */}
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <SectionHeader icon={<User />} title="Información Básica" color="text-indigo-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <PremiumInput
                                label="Nombre Completo"
                                name="nombre_candidato"
                                value={formData.nombre_candidato}
                                onChange={handleChange}
                                icon={<User size={16} />}
                                required
                            />
                            <PremiumSelect
                                label="Vacante a Postular"
                                name="vacante_id"
                                value={formData.vacante_id}
                                onChange={handleChange}
                                icon={<Briefcase size={16} />}
                                options={vacantes.map(v => ({
                                    value: v.id,
                                    label: `${v.puesto_nombre} (${v.codigo_requisicion})`
                                }))}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumSelect
                                label="Fuente Reclutamiento"
                                name="fuente_reclutamiento"
                                value={formData.fuente_reclutamiento}
                                onChange={handleChange}
                                icon={<Linkedin size={16} />}
                                options={[
                                    { value: 'LinkedIn', label: 'LinkedIn' },
                                    { value: 'Computrabajo', label: 'Computrabajo' },
                                    { value: 'Referido', label: 'Referido' },
                                    { value: 'SENA', label: 'SENA' },
                                    { value: 'Volanteo', label: 'Volanteo' },
                                    { value: 'Otras Redes', label: 'Otras Redes' }
                                ]}
                            />
                            <PremiumInput
                                label="Salario Pretendido ($)"
                                name="salario_pretendido"
                                type="number"
                                value={formData.salario_pretendido}
                                onChange={handleChange}
                                icon={<DollarSign size={16} />}
                            />
                        </div>

                        {/* Datos del Portal — solo visible en edición */}
                        {isEditing && (formData.cedula || formData.email || formData.telefono) && (
                            <div className="border border-indigo-500/20 bg-indigo-500/[0.03] rounded-3xl p-6 space-y-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em]">Datos ingresados por el candidato vía portal</p>
                                </div>

                                {/* Fila 1: Identificación */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <InfoChip label="Tipo ID" value={formData.tipo_identificacion} />
                                    <InfoChip label="Número de Cédula" value={formData.cedula} highlight />
                                    <InfoChip label="Lugar de Expedición" value={formData.lugar_expedicion} />
                                    <InfoChip label="Fecha de Expedición" value={formData.fecha_expedicion ? new Date(formData.fecha_expedicion).toLocaleDateString('es-CO') : undefined} />
                                </div>

                                {/* Fila 2: Contacto */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <InfoChip label="Teléfono / Celular" value={formData.telefono} />
                                    <InfoChip label="Correo Electrónico" value={formData.email} />
                                    <InfoChip label="Ciudad de Residencia" value={formData.ciudad} />
                                </div>

                                {/* Fila 3: Datos personales */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <InfoChip label="Fecha de Nacimiento" value={formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toLocaleDateString('es-CO') : undefined} />
                                    <InfoChip label="Género" value={formData.genero} />
                                    <InfoChip label="Estado Civil" value={formData.estado_civil} />
                                    <InfoChip label="Grupo Étnico" value={formData.grupo_etnico} />
                                </div>

                                {/* Fila 4: Residencia */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <InfoChip label="Dirección de Residencia" value={formData.direccion} className="md:col-span-2" />
                                    <InfoChip label="Estrato" value={formData.estrato} />
                                </div>

                                {/* Fila 5: Familia en empresa */}
                                {formData.tiene_familiar === 'Si' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <InfoChip label="Familiar en empresa" value="Sí" />
                                        <InfoChip label="Parentesco" value={formData.parentesco_familiar} />
                                        <InfoChip label="Nombre Familiar" value={formData.nombre_familiar} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hoja de Vida Embebida - Solo mostramos si NO estamos en vista dividida */}
                        {!isEditing && (
                            <PremiumInput
                                label="Enlace Hoja de Vida (CV)"
                                name="cv_url"
                                value={formData.cv_url}
                                onChange={handleChange}
                                icon={<FileText size={16} />}
                            />
                        )}
                    </section>

                    {/* SECCIÓN NUEVA: DETALLES DE LA POSTULACIÓN (RECLUTADOR) */}
                    {isEditing && formData.cedula && (
                        <section className="space-y-10 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <SectionHeader icon={<Info />} title="Detalles de la Postulación (Portal Público)" color="text-amber-400" />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Datos Personales Expandidos */}
                                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><User size={18} /></div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Identificación y Ubicación</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Documento</p>
                                            <p className="text-sm text-white font-medium">{formData.tipo_identificacion || 'C.C.'} {formData.cedula}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lugar / Fecha Exp.</p>
                                            <p className="text-sm text-white font-medium">{formData.lugar_expedicion || 'N/A'} - {formData.fecha_expedicion ? new Date(formData.fecha_expedicion).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fecha Nacimiento</p>
                                            <p className="text-sm text-white font-medium">{formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vivienda y Estrato</p>
                                            <p className="text-sm text-white font-medium">{formData.tipo_vivienda || 'N/A'} (Estrato {formData.estrato || 'N/A'})</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dirección de Residencia</p>
                                            <p className="text-sm text-white font-medium flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> {formData.direccion || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Familiar en empresa</p>
                                            <p className="text-sm text-white font-medium">{formData.tiene_familiar === 'Si' ? `Sí (${formData.parentesco_familiar}: ${formData.nombre_familiar})` : 'No'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado Civil / Género</p>
                                            <p className="text-sm text-white font-medium">{formData.estado_civil || 'N/A'} / {formData.genero || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Información Familiar y Herramientas */}
                                <div className="space-y-8">
                                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Users size={18} /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Situación Familiar</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hijos</p>
                                                <p className="text-sm text-white font-medium">{formData.tiene_hijos === 'Si' ? `${formData.cantidad_hijos} hijo(s)` : 'Sin hijos'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cabeza de Familia</p>
                                                <p className="text-sm text-white font-medium">{formData.cabeza_familia || 'No'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Discapacidad</p>
                                                <p className="text-sm text-white font-medium">{formData.discapacidad || 'Ninguna'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Truck size={18} /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Herramientas y Vehículo</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehículo</p>
                                                <p className="text-sm text-white font-medium">{formData.tipo_vehiculo || 'No cuenta'}</p>
                                            </div>
                                            {formData.tipo_vehiculo && formData.tipo_vehiculo !== 'No cuenta' && (
                                                <>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Placa</p>
                                                        <p className="text-sm text-white font-medium">{formData.vehiculo_placa}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Marca/Modelo/Propietario</p>
                                                        <p className="text-sm text-white font-medium">{formData.vehiculo_marca_modelo} ({formData.vehiculo_modelo_ano}) - {formData.vehiculo_nombre_propietario}</p>
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dispuesto usar Celular</p>
                                                <p className="text-sm text-white font-medium flex items-center gap-2"><Smartphone size={14} className="text-indigo-400" /> {formData.dispuesto_celular || 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Formación Académica Table */}
                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Book size={18} /></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Formación Académica</h3>
                                    {formData.tiene_tarjeta_profesional === 'Si' && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-full">
                                            <Shield size={10} /> Tarjeta Prof: {formData.numero_tarjeta_profesional}
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-separate border-spacing-y-2">
                                        <thead>
                                            <tr className="text-slate-500 uppercase tracking-widest font-black">
                                                <th className="pb-4 pl-4">Nivel</th>
                                                <th className="pb-4">Institución</th>
                                                <th className="pb-4">Título</th>
                                                <th className="pb-4">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const fa = formData.formacion_academica ? (typeof formData.formacion_academica === 'string' ? JSON.parse(formData.formacion_academica) : formData.formacion_academica) : [];
                                                if (Array.isArray(fa) && fa.length > 0) {
                                                    return fa.map((f: any, i: number) => (
                                                        <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors">
                                                            <td className="py-4 pl-4 rounded-l-xl font-bold text-white">{f.nivel}</td>
                                                            <td className="py-4 text-slate-300">{f.institucion}</td>
                                                            <td className="py-4 text-slate-300">{f.titulo}</td>
                                                            <td className="py-4 pr-4 rounded-r-xl">
                                                                <span className={`px-2 py-1 rounded-md ${f.completado === 'Si' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                    {f.completado === 'Si' ? 'Completo' : 'Incompleto'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ));
                                                }
                                                return <tr><td colSpan={4} className="py-8 text-center text-slate-600 font-bold italic tracking-widest uppercase">Sin información académica registrada</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Historial Laboral Table */}
                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Briefcase size={18} /></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Historial Laboral</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-separate border-spacing-y-2">
                                        <thead>
                                            <tr className="text-slate-500 uppercase tracking-widest font-black">
                                                <th className="pb-4 pl-4">Empresa</th>
                                                <th className="pb-4">Cargo</th>
                                                <th className="pb-4 text-center">Experiencia</th>
                                                <th className="pb-4 text-right pr-4">Logros</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const hl = formData.historial_laboral ? (typeof formData.historial_laboral === 'string' ? JSON.parse(formData.historial_laboral) : formData.historial_laboral) : [];
                                                if (Array.isArray(hl) && hl.length > 0) {
                                                    return hl.map((h: any, i: number) => (
                                                        <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors">
                                                            <td className="py-4 pl-4 rounded-l-xl font-bold text-white">{h.empresa}</td>
                                                            <td className="py-4 text-slate-300">{h.cargo}</td>
                                                            <td className="py-4 text-center">
                                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-bold">
                                                                    {h.anos || 0}a {h.meses || 0}m
                                                                </span>
                                                            </td>
                                                            <td className="py-4 pr-4 rounded-r-xl text-right text-slate-500 italic max-w-xs truncate">{h.logros || 'N/A'}</td>
                                                        </tr>
                                                    ));
                                                }
                                                return <tr><td colSpan={4} className="py-8 text-center text-slate-600 font-bold italic tracking-widest uppercase">Sin historial laboral registrado</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* BOTÓN PARA DESPLEGAR CALIFICACIÓN */}
                    {isEditing && (
                        <div className="flex flex-col items-center gap-6 py-6 border-y border-white/5 bg-white/[0.01]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gestión del Talento</p>
                            <button
                                type="button"
                                onClick={() => setShowRatingFields(!showRatingFields)}
                                className={cn(
                                    "flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                                    showRatingFields
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                        : "bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105"
                                )}
                            >
                                {showRatingFields ? (
                                    <>
                                        <X size={18} />
                                        <span>OCULTAR PANELES DE CALIFICACIÓN</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} className="animate-pulse" />
                                        <span>CALIFICAR AL CANDIDATO</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* SECCIONES CONDICIONALES */}
                    {(!isEditing || showRatingFields) && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* SECCIÓN 2: PROCESO */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <SectionHeader icon={<CheckCircle2 />} title="Estado del Proceso" color="text-emerald-400" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumSelect
                                label="Etapa Actual"
                                name="etapa_actual"
                                value={formData.etapa_actual}
                                onChange={handleChange}
                                options={[
                                    { value: 'Postulación', label: 'Postulación' },
                                    { value: 'Entrevista RH', label: 'Entrevista RH' },
                                    { value: 'Prueba Técnica', label: 'Prueba Técnica' },
                                    { value: 'Entrevista Técnica', label: 'Entrevista Técnica' },
                                    { value: 'Entrevista Final', label: 'Entrevista Final' },
                                    { value: 'Oferta', label: 'Oferta' },
                                    { value: 'Contratado', label: 'Contratado' },
                                    { value: 'Descartado', label: 'Descartado' }
                                ]}
                            />
                            <PremiumSelect
                                label="Estado Entrevista"
                                name="estado_entrevista"
                                value={formData.estado_entrevista}
                                onChange={handleChange}
                                options={[
                                    { value: 'Pendiente', label: 'Pendiente' },
                                    { value: 'En Curso', label: 'En Curso' },
                                    { value: 'Realizada', label: 'Realizada' },
                                    { value: 'No Asistió', label: 'No Asistió' }
                                ]}
                            />
                            <PremiumInput
                                label="Fecha Entrevista"
                                name="fecha_entrevista"
                                type="date"
                                value={formData.fecha_entrevista}
                                onChange={handleChange}
                                icon={<Calendar size={16} />}
                            />
                        </div>
                    </section>

                    {/* SECCIÓN 3: EVALUACIÓN Y RESULTADOS */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <SectionHeader icon={<CheckCircle2 />} title="Evaluación y Resultados" color="text-green-400" />

                        {/* Row 1: Resultado y Calificación */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumSelect
                                label="Resultado Candidato"
                                name="resultado_candidato"
                                value={formData.resultado_candidato}
                                onChange={handleChange}
                                options={[
                                    { value: '', label: 'Pendiente' },
                                    { value: 'Apto', label: 'Apto' },
                                    { value: 'No Apto', label: 'No Apto' }
                                ]}
                            />
                            <PremiumInput
                                label="Calificación Técnica (0-5)"
                                name="calificacion_tecnica"
                                type="number"
                                value={formData.calificacion_tecnica}
                                onChange={handleChange}
                                placeholder="0.0"
                            />
                            <PremiumInput
                                label="Estatus 90 Días"
                                name="estatus_90_dias"
                                value={formData.estatus_90_dias}
                                onChange={handleChange}
                                placeholder="Ej: Activo, Rotación, etc."
                            />
                        </div>

                        {/* Row 2: Motivo No Apto */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="relative group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Motivo No Apto</label>
                                <textarea
                                    name="motivo_no_apto"
                                    value={formData.motivo_no_apto}
                                    onChange={handleChange}
                                    placeholder="Especificar razón si el candidato no es apto..."
                                    className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl p-6 text-sm text-slate-200 focus:border-green-500/50 focus:shadow-[0_0_30px_rgba(34,197,94,0.1)] outline-none transition-all duration-300 min-h-[100px]"
                                />
                            </div>
                        </div>

                        {/* Row 3: Resultado Final */}
                        <div className="grid grid-cols-1 gap-8">
                            <PremiumInput
                                label="Resultado Final"
                                name="resultado_final"
                                value={formData.resultado_final}
                                onChange={handleChange}
                                placeholder="Resumen del proceso de selección"
                            />
                        </div>
                    </section>

                    {/* SECCIÓN 4: AI INSIGHTS v3.0 */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                        <SectionHeader icon={<Zap />} title="AI Logic & Insights" color="text-indigo-400" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="md:col-span-1">
                                <PremiumInput
                                    label="AI Match Score (%)"
                                    name="score_tecnico_ia"
                                    type="number"
                                    value={formData.score_tecnico_ia || ''}
                                    onChange={handleChange}
                                    icon={<Zap size={16} className="text-indigo-400" />}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Resumen Predictivo por IA</label>
                                    <textarea
                                        name="resumen_ia_entrevista"
                                        value={formData.resumen_ia_entrevista || ''}
                                        onChange={handleChange}
                                        placeholder="Esperando análisis de perfil..."
                                        className="w-full bg-slate-950/50 border-2 border-white/5 rounded-2xl p-6 text-sm text-slate-200 focus:border-indigo-500/50 focus:shadow-[0_0_30px_rgba(99,102,241,0.1)] outline-none transition-all duration-300 min-h-[120px]"
                                    />
                                    <button
                                        type="button"
                                        className="absolute bottom-4 right-4 p-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-xl"
                                        title="Dictar resultado (Zero-UI Voice Pipeline)"
                                    >
                                        <Bot size={20} className="animate-pulse" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>



                    {/* SECCIÓN 5: TRAZABILIDAD Y AUDITORÍA (Solo en edición) */}
                    {isEditing && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                            {/* Columna Izquierda: Actividad del Candidato (Portal) */}
                            <section className="space-y-8">
                                <SectionHeader icon={<History />} title="Comportamiento en Portal" color="text-indigo-400" />
                                <ActivityLogViewer candidateTrackingId={Number(id)} />
                            </section>

                            {/* Columna Derecha: Trazabilidad Corporativa (Auditoría Admin) */}
                            <section className="space-y-8">
                                <SectionHeader icon={<ShieldCheck />} title="Bitácora de Seguimiento" color="text-emerald-400" />
                                <AuditTimeline entityId={id!} />
                            </section>
                        </div>
                    )}


                        </div>
                    )}

                    <div className="flex justify-end gap-6 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-4 text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="relative overflow-hidden group px-12 py-4 rounded-xl font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all group-hover:scale-110" />
                            <div className="relative flex items-center gap-3">
                                <Save size={20} className="group-hover:animate-bounce" />
                                <span>{isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR CANDIDATO'}</span>
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
};

// InfoChip: read-only data chip for portal-submitted candidate data
const InfoChip: React.FC<{ label: string; value?: string | null; highlight?: boolean; className?: string }> = ({ label, value, highlight, className = '' }) => (
    <div className={`flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 ${className}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className={`text-xs font-bold truncate ${highlight ? 'text-indigo-500' : 'text-slate-200'} ${!value ? 'text-slate-600 italic' : ''}`}>
            {value || 'No informado'}
        </p>
    </div>
);

export default CandidatoForm;

