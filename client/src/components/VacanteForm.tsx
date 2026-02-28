import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import {
    ChevronLeft,
    Save,
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
    DollarSign
} from 'lucide-react';
import { SectionHeader, PremiumInput, PremiumSelect } from './ui/PremiumComponents';

const VacanteForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [sedes, setSedes] = useState<any[]>([]);
    const [procesos, setProcesos] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [centros, setCentros] = useState<any[]>([]);
    const [subcentros, setSubcentros] = useState<any[]>([]);
    const [tiposTrabajo, setTiposTrabajo] = useState<any[]>([]);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);

    const [formData, setFormData] = useState({
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
        // Edit only fields
        estado: 'Abierta',
        fecha_cierre_real: '',
        cantidad: 1 // Default to 1
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load Config
                const configRes = await api.get('/config/config-data');
                const data = configRes.data;
                setSedes(data.sedes);
                setProcesos(data.procesos);
                setProyectos(data.proyectos);
                setCentros(data.centros);
                setSubcentros(data.subcentros);
                setTiposTrabajo(data.tiposTrabajo);
                setTiposProyecto(data.tiposProyecto);

                // 2. If Editing, Load Vacancy
                if (isEditing) {
                    const vacanteRes = await api.get(`/vacantes/${id}`);
                    const v = vacanteRes.data;
                    setFormData({
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
                        fecha_cierre_real: v.fecha_cierre_real ? v.fecha_cierre_real.substring(0, 10) : ''
                    });
                } else {
                    // Fetch next code for new vacancy
                    const codeRes = await api.get('/vacantes/next-code');

                    // Defaults for new
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
                }
            } catch (error) {
                console.error('Error loading data:', error);
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
                await api.put(`/vacantes/${id}`, formData);
            } else {
                await api.post('/vacantes', formData);
            }
            navigate('/vacantes');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al guardar vacante.');
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
                            {isEditing ? `Editar Vacante: ${formData.codigo_requisicion}` : 'Nueva Requisición de Talento'}
                        </h2>
                        <p className="text-white/70 text-sm mt-1 font-medium">Define la estructura y ubicación estratégica de la vacante</p>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg hidden sm:block rotate-3 hover:rotate-6 transition-transform duration-500">
                        <img src="/logo_discol.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-12">

                    {/* SECCIÓN 1: IDENTIFICACIÓN */}
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <SectionHeader icon={<Hash />} title="Identificación del Puesto" color="text-[#3a94cc]" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumInput
                                label="Código Requisición"
                                name="codigo_requisicion"
                                value={formData.codigo_requisicion}
                                onChange={handleChange}
                                icon={<Hash size={16} />}
                                disabled={isEditing}
                                required
                            />
                            {!isEditing && (
                                <PremiumInput
                                    label="Cantidad Vacantes"
                                    name="cantidad"
                                    type="number"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    min="1"
                                    max="10"
                                    icon={<Users size={16} />}
                                    required
                                />
                            )}
                            <PremiumInput
                                label="Posición / Puesto"
                                name="puesto_nombre"
                                value={formData.puesto_nombre}
                                onChange={handleChange}
                                icon={<Tag size={16} />}
                                required
                            />
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

                    {/* SECCIÓN 2: ASIGNACIÓN ESTRATÉGICA */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <SectionHeader icon={<Briefcase />} title="Asignación y Proyecto" color="text-[#3a94cc]" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                    {/* SECCIÓN 3: ESTRUCTURA FINANCIERA */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <SectionHeader icon={<PieChart />} title="Estructura de Costos" color="text-blue-400" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    </section>

                    {/* SECCIÓN 4: LOGÍSTICA Y CRONOGRAMA */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                        <SectionHeader icon={<MapPin />} title="Ubicación y Tiempo" color="text-emerald-400" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumSelect
                                label="Sede Principal"
                                name="sede_id"
                                value={formData.sede_id}
                                onChange={handleChange}
                                icon={<MapPin size={16} />}
                                options={sedes.map(s => ({ value: s.id, label: s.nombre }))}
                            />
                            <PremiumSelect
                                label="Proceso"
                                name="proceso_id"
                                value={formData.proceso_id}
                                onChange={handleChange}
                                icon={<Info size={16} />}
                                options={procesos.map(p => ({ value: p.id, label: p.nombre }))}
                            />
                            <PremiumInput
                                label="Días SLA Meta"
                                name="dias_sla_meta"
                                type="number"
                                value={formData.dias_sla_meta}
                                onChange={handleChange}
                                icon={<Clock size={16} />}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <PremiumInput
                                label="Fecha de Apertura"
                                name="fecha_apertura"
                                type="date"
                                value={formData.fecha_apertura}
                                onChange={handleChange}
                                icon={<Calendar size={16} />}
                                required
                            />
                            <PremiumInput
                                label="Cierre Estimado"
                                name="fecha_cierre_estimada"
                                type="date"
                                value={formData.fecha_cierre_estimada}
                                onChange={handleChange}
                                icon={<Calendar size={16} />}
                                required
                            />
                        </div>
                    </section>

                    {/* SECCIÓN 5: CONDICIONES Y FINANZAS v3.0 */}
                    <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                        <SectionHeader icon={<CreditCard />} title="Responsabilidades y Finanzas 3.0" color="text-amber-400" />

                        {/* Row 1: Prioridad y Responsable */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                            <PremiumInput
                                label="Responsable RH"
                                name="responsable_rh"
                                value={formData.responsable_rh}
                                onChange={handleChange}
                                icon={<Users size={16} />}
                            />
                            <PremiumInput
                                label="Presupuesto Aprobado ($)"
                                name="presupuesto_aprobado"
                                type="number"
                                value={formData.presupuesto_aprobado}
                                onChange={handleChange}
                                icon={<DollarSign size={16} />}
                            />
                            <PremiumInput
                                label="Presupuesto Máx ($)"
                                name="presupuesto_max"
                                type="number"
                                value={formData.presupuesto_max || ''}
                                onChange={handleChange}
                                icon={<DollarSign size={16} />}
                            />
                        </div>

                        {/* Row 2: Salarios */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <PremiumInput
                                label="Salario Base ($)"
                                name="salario_base"
                                type="number"
                                value={formData.salario_base}
                                onChange={handleChange}
                            />
                            <PremiumInput
                                label="Salario Ofrecido ($)"
                                name="salario_base_ofrecido"
                                type="number"
                                value={formData.salario_base_ofrecido}
                                onChange={handleChange}
                            />
                            <PremiumInput
                                label="Salario Pactado ($)"
                                name="salario_pactado"
                                type="number"
                                value={formData.salario_pactado || ''}
                                onChange={handleChange}
                            />
                            <PremiumInput
                                label="Costo Final Est. ($)"
                                name="costo_final_contratacion"
                                type="number"
                                value={formData.costo_final_contratacion}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Row 3: Costos y SLA */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumInput
                                label="Costo Vacante ($)"
                                name="costo_vacante"
                                type="number"
                                value={formData.costo_vacante}
                                onChange={handleChange}
                            />
                            <PremiumInput
                                label="Costo Vacante/Día ($) [v3.0]"
                                name="costo_dia_vacante"
                                type="number"
                                value={formData.costo_dia_vacante || ''}
                                onChange={handleChange}
                                icon={<Zap size={16} className="text-indigo-400" />}
                            />
                            <PremiumInput
                                label="SLA Meta (días)"
                                name="dias_sla_meta"
                                type="number"
                                value={formData.dias_sla_meta}
                                onChange={handleChange}
                                icon={<Clock size={16} />}
                            />
                        </div>

                        {/* AI Sourcing Agent Widget */}
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
                            <button
                                type="button"
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                            >
                                Activar Agente
                            </button>
                        </div>
                    </section>

                    <div className="pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">Observaciones / Requisitos</label>
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            className="w-full bg-[#0d1117] border-2 border-white/5 rounded-2xl p-6 text-sm text-white focus:border-[#3a94cc] focus:shadow-[0_0_20px_rgba(58,148,204,0.1)] outline-none transition-all duration-300 resize-none h-32"
                            placeholder="Detalla los requisitos técnicos, habilidades blandas necesarias y motivaciones para esta vacante..."
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-6 pt-6">
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
                                <span>{isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR VACANTE'}</span>
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Imported from ../ui/PremiumComponents

export default VacanteForm;
