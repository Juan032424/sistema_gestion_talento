import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    Bot
} from 'lucide-react';
import { SectionHeader, PremiumInput, PremiumSelect } from './ui/PremiumComponents';
import ActivityLogViewer from './ActivityLogViewer';
import { History } from 'lucide-react';

const CandidatoForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [vacantes, setVacantes] = useState<any[]>([]);

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
        resumen_ia_entrevista: ''
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
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-semibold mb-8 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Volver al listado
            </button>

            <div className="bg-[#161b22] border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-20 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-r from-[#1e4b7a] to-[#3a94cc] p-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {isEditing ? `Editar Candidato: ${formData.nombre_candidato}` : 'Registrar Nuevo Candidato'}
                        </h2>
                        <p className="text-white/70 text-sm mt-1 font-medium">Gestión integral del proceso de selección</p>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg hidden sm:block rotate-3 hover:rotate-6 transition-transform duration-500">
                        <img src="/logo_discol.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-12">
                    {/* SECCIÓN 1: DATOS PERSONALES */}
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <SectionHeader icon={<User />} title="Información Básica" color="text-[#3a94cc]" />
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
                            <PremiumInput
                                label="Enlace Hoja de Vida (CV)"
                                name="cv_url"
                                value={formData.cv_url}
                                onChange={handleChange}
                                icon={<FileText size={16} />}
                            />
                        </div>
                    </section>

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
                    {/* SECCIÓN 5: HISTORIAL DE ACTIVIDAD (Solo en edición) */}
                    {isEditing && (
                        <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                            <SectionHeader icon={<History />} title="Historial de Actividad del Candidato" color="text-blue-400" />
                            <ActivityLogViewer candidateTrackingId={Number(id)} />
                        </section>
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
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1e4b7a] to-[#3a94cc] transition-all group-hover:scale-110" />
                            <div className="relative flex items-center gap-3">
                                <Save size={20} className="group-hover:animate-bounce" />
                                <span>{isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR CANDIDATO'}</span>
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Imported from ../ui/PremiumComponents

export default CandidatoForm;
