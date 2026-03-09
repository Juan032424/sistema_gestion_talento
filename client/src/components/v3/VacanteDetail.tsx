import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useToast } from '../ToastNotification';
import type { Vacante, Candidato } from '../../types';
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    DollarSign,
    Calendar,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Activity,
    Target,
    Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const VacanteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [vacante, setVacante] = useState<Vacante | null>(null);
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVacanteDetails();
    }, [id]);

    const fetchVacanteDetails = async () => {
        try {
            setLoading(true);
            const [vacanteRes, postulacionesRes] = await Promise.all([
                api.get(`/vacantes/${id}`),
                api.get(`/candidatos/vacante/${id}`)
            ]);

            setVacante(vacanteRes.data);
            setCandidatos(postulacionesRes.data || []);
        } catch (error) {
            console.error('Error cargando detalles:', error);
            showToast('Error al cargar la vacante', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarVacante = async () => {
        if (!vacante) return;

        try {
            // Check if there is at least one hired candidate
            const hasHired = candidatos.some(c => c.etapa_actual === 'Contratado');

            if (!hasHired && !window.confirm('No hay candidatos contratados. ¿Estás seguro de cerrar la vacante?')) {
                return;
            }

            await api.put(`/vacantes/${vacante.id}`, {
                estado: 'Cubierta',
                fecha_cierre_real: new Date().toISOString().split('T')[0]
            });

            showToast('Vacante cerrada exitosamente', 'success');
            fetchVacanteDetails();
        } catch (error) {
            console.error('Error cerrando vacante:', error);
            showToast('Error al cerrar la vacante', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!vacante) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Briefcase size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Vacante no encontrada</h2>
                <button
                    onClick={() => navigate('/vacantes')}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    Volver a la lista
                </button>
            </div>
        );
    }

    // Calcular KPI basicos
    const calculateDesfase = (v: Vacante) => {
        const start = new Date(v.fecha_apertura);
        const end = v.fecha_cierre_real ? new Date(v.fecha_cierre_real) : new Date();
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const diffDays = calculateDesfase(vacante);
    const inTime = diffDays <= (vacante.dias_sla_meta || 15);

    const statsCards = [
        { title: 'Total Postulados', value: candidatos.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { title: 'En Entrevista', value: candidatos.filter(c => c.etapa_actual.includes('Entrevista')).length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { title: 'Días Activa', value: diffDays, icon: Clock, color: inTime ? 'text-emerald-400' : 'text-rose-400', bg: inTime ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
        { title: 'Contratados', value: candidatos.filter(c => c.etapa_actual === 'Contratado').length, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12 max-w-7xl mx-auto"
        >
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vacantes')}
                        className="p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-all group"
                    >
                        <ArrowLeft className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-white">{vacante.puesto_nombre}</h1>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                vacante.estado === 'Cubierta' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    vacante.estado === 'Abierta' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            )}>
                                {vacante.estado}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400 font-mono">
                            {vacante.codigo_requisicion} · Generada el {new Date(vacante.fecha_apertura).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {vacante.estado !== 'Cubierta' && (
                        <button
                            onClick={handleCerrarVacante}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold hover:bg-emerald-600/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        >
                            <CheckCircle2 size={16} />
                            Cerrar Vacante
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna Izquierda: Detalles */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Tarjeta de Resumen */}
                    <div className="bg-[#0d1117] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Briefcase size={120} />
                        </div>

                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Target size={14} className="text-indigo-400" />
                            Especificaciones
                        </h3>

                        <div className="space-y-5 relative z-10">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/5 rounded-lg shrink-0">
                                    <MapPin size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ubicación</p>
                                    <p className="text-sm font-medium text-white">{vacante.sede_nombre || 'Sede principal'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/5 rounded-lg shrink-0">
                                    <Users size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Responsable</p>
                                    <p className="text-sm font-medium text-white">{vacante.responsable_rh}</p>
                                    <p className="text-[10px] text-gray-500">{vacante.proceso_nombre || 'Selección'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/5 rounded-lg shrink-0">
                                    <DollarSign size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Presupuesto</p>
                                    <p className="text-sm font-medium text-white font-mono">${new Intl.NumberFormat().format(vacante.presupuesto_aprobado || 0)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/5 rounded-lg shrink-0">
                                    <Calendar size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fechas</p>
                                    <p className="text-[11px] text-gray-300">Apertura: {new Date(vacante.fecha_apertura).toLocaleDateString()}</p>
                                    <p className="text-[11px] text-gray-300 border-l-2 border-amber-500/50 pl-2 my-1">
                                        Meta: {new Date(vacante.fecha_cierre_estimada).toLocaleDateString()}
                                    </p>
                                    {vacante.fecha_cierre_real && (
                                        <p className="text-[11px] text-emerald-400 font-bold">Cierre: {new Date(vacante.fecha_cierre_real).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>

                            {vacante.observaciones && (
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed mt-4">
                                    {vacante.observaciones}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Pipeline & Stats */}
                <div className="space-y-6 lg:col-span-2">

                    {/* KPIs Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {statsCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#0d1117] border border-white/5 rounded-2xl p-4 flex flex-col justify-center shadow-lg"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                                        <stat.icon size={16} className={stat.color} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{stat.title}</h4>
                                </div>
                                <div className="text-3xl font-black text-white px-1">
                                    {stat.value}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tabla de Postulados */}
                    <div className="bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                                <Users size={16} className="text-indigo-400" />
                                Trazabilidad de Candidatos
                            </h3>
                            <span className="text-xs font-bold text-gray-500 px-3 py-1 bg-white/5 rounded-full">
                                {candidatos.length} / {candidatos.length} registrados
                            </span>
                        </div>

                        <div className="overflow-x-auto min-h-[300px]">
                            {candidatos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                                        <AlertCircle size={24} className="text-gray-500" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-300">Aún no hay postulaciones</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">Comparte el enlace de la vacante o registra candidatos manualmente desde la Base de Datos general.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#161b22]">
                                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                            <th className="p-4 px-6">Candidato</th>
                                            <th className="p-4">Etapa Actual</th>
                                            <th className="p-4">Postulación</th>
                                            <th className="p-4">Fuente</th>
                                            <th className="p-4 text-center">Calificación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {candidatos.map((c) => (
                                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 px-6">
                                                    <div className="font-bold text-sm text-white">{c.nombre_candidato}</div>
                                                    {c.cv_url && (
                                                        <a href={c.cv_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline mt-0.5 block">
                                                            Ver Hoja de Vida
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                                                        c.etapa_actual === 'Contratado' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                            c.etapa_actual === 'Oferta' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                                c.etapa_actual === 'Descartado' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                    c.etapa_actual.includes('Entrevista') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                        "bg-white/5 text-gray-300 border-white/10"
                                                    )}>
                                                        {c.etapa_actual}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs font-mono text-gray-500 shrink-0">
                                                    {c.fecha_postulacion ? new Date(c.fecha_postulacion).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400 font-medium">
                                                    {c.fuente_reclutamiento}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className={cn(
                                                        "inline-flex items-center justify-center p-1.5 rounded-lg border",
                                                        (Number(c.calificacion_tecnica) || 0) >= 4 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                                                            (Number(c.calificacion_tecnica) || 0) >= 3 ? "bg-amber-500/5 border-amber-500/20 text-amber-400" :
                                                                "bg-white/5 border-white/5 text-gray-500"
                                                    )}>
                                                        <span className="text-xs font-black w-8">{c.calificacion_tecnica ? Number(c.calificacion_tecnica).toFixed(1) : '—'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default VacanteDetail;
