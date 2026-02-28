import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from './ToastNotification';
import type { Vacante, Candidato } from '../types';
import {
    Database,
    Filter,
    Download,
    Edit2,
    Check,
    X,
    Users,
    LayoutDashboard,
    Clock,
    Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PremiumInput, PremiumSelect } from './ui/PremiumComponents';

const DataView: React.FC = () => {
    const { showToast } = useToast();
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);

    // Vacante Edit State
    const [editingVacancyId, setEditingVacancyId] = useState<number | null>(null);
    const [vacancyEditForm, setVacancyEditForm] = useState<Partial<Vacante>>({});

    // Candidato Edit State
    const [editingCandidatoId, setEditingCandidatoId] = useState<number | null>(null);
    const [candidatoEditForm, setCandidatoEditForm] = useState<Partial<Candidato>>({});

    // New Candidato State
    const [isAddingCandidato, setIsAddingCandidato] = useState(false);
    const [newCandidato, setNewCandidato] = useState<Partial<Candidato>>({
        nombre_candidato: '',
        vacante_id: undefined,
        etapa_actual: 'Postulación',
        fuente_reclutamiento: 'LinkedIn',
        salario_pretendido: 0,
        estado_entrevista: 'Pendiente'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                api.get('/vacantes'),
                api.get('/candidatos')
            ]);
            setVacantes(vRes.data);
            setCandidatos(cRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // Vacancy actions
    const handleVacancyEdit = (v: Vacante) => {
        setEditingVacancyId(v.id);
        setVacancyEditForm(v);
    };

    const handleVacancySave = async (id: number) => {
        try {
            // Only send fields that belong to the database table
            const updatePayload = {
                estado: vacancyEditForm.estado,
                fecha_cierre_real: vacancyEditForm.fecha_cierre_real,
                costo_vacante: vacancyEditForm.costo_vacante
            };

            await api.put(`/vacantes/${id}`, updatePayload);
            setEditingVacancyId(null);
            setEditingVacancyId(null);
            fetchData();
            showToast("Vacante actualizada correctamente", "success");
        } catch (error) {
            showToast("Error al actualizar la vacante", "error");
        }
    };

    // Candidate actions
    const handleCandidatoEdit = (c: Candidato) => {
        setEditingCandidatoId(c.id);
        setCandidatoEditForm(c);
    };

    const handleCandidatoSave = async (id: number) => {
        try {
            const updatePayload = {
                etapa_actual: candidatoEditForm.etapa_actual,
                fuente_reclutamiento: candidatoEditForm.fuente_reclutamiento,
                cv_url: candidatoEditForm.cv_url,
                estado_entrevista: candidatoEditForm.estado_entrevista,
                fecha_entrevista: candidatoEditForm.fecha_entrevista,
                resultado_candidato: candidatoEditForm.resultado_candidato,
                motivo_no_apto: candidatoEditForm.motivo_no_apto,
                estatus_90_dias: candidatoEditForm.estatus_90_dias,
                calificacion_tecnica: candidatoEditForm.calificacion_tecnica,
                resultado_final: candidatoEditForm.resultado_final
            };

            console.log("NASA Debug: Sending Candidate Update", updatePayload);
            await api.put(`/candidatos/${id}`, updatePayload);
            setEditingCandidatoId(null);
            fetchData();
            setEditingCandidatoId(null);
            fetchData();
            showToast("Candidato actualizado con éxito", "success");
        } catch (error: any) {
            console.error("NASA Frontend Error Log:", error.response?.data || error);
            showToast("No se pudo actualizar el candidato", "error");
        }
    };

    const handleCreateCandidato = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/candidatos', newCandidato);
            setIsAddingCandidato(false);
            setNewCandidato({
                nombre_candidato: '',
                vacante_id: undefined,
                etapa_actual: 'Postulación',
                fuente_reclutamiento: 'LinkedIn',
                salario_pretendido: 0,
                estado_entrevista: 'Pendiente'
            });
            fetchData();
            showToast("Candidato registrado exitosamente", "success");
        } catch (error) {
            showToast("Error al registrar candidato. Verifica los campos.", "error");
        }
    };

    const calculateDesfase = (v: Vacante) => {
        const start = new Date(v.fecha_apertura);
        const end = v.fecha_cierre_real ? new Date(v.fecha_cierre_real) : new Date();
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Database className="text-blue-500" />
                        Base de Datos de Gestión (Data)
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Control total de KPIs y efectividad de selección</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                        <Filter size={14} />
                        Filtros Avanzados
                    </button>
                    <button
                        onClick={() => setIsAddingCandidato(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus size={14} />
                        Registrar Candidato
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <Download size={14} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* VACANCIES TABLE */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 ml-2">
                    <LayoutDashboard size={16} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Maestro de Vacantes</h3>
                </div>
                <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto overflow-y-auto max-h-[40vh] custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#0d1117] border-b border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="p-4 whitespace-nowrap">Código REQ</th>
                                    <th className="p-4 whitespace-nowrap">Puesto</th>
                                    <th className="p-4 whitespace-nowrap">Estado Cubrimiento</th>
                                    <th className="p-4 whitespace-nowrap">Apertura</th>
                                    <th className="p-4 whitespace-nowrap">Cierre Estimado</th>
                                    <th className="p-4 whitespace-nowrap">Cierre Real</th>
                                    <th className="p-4 whitespace-nowrap text-blue-400">Días Desfase</th>
                                    <th className="p-4 whitespace-nowrap">SLA Meta</th>
                                    <th className="p-4 whitespace-nowrap">Costo Vacante</th>
                                    <th className="p-4 whitespace-nowrap text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {vacantes.map((v) => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 font-mono text-xs text-gray-500">{v.codigo_requisicion}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-white text-sm">{v.puesto_nombre}</div>
                                        </td>
                                        <td className="p-4">
                                            {editingVacancyId === v.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={vacancyEditForm.estado}
                                                    onChange={(e) => setVacancyEditForm({ ...vacancyEditForm, estado: e.target.value as any })}
                                                >
                                                    <option value="Abierta">Abierta</option>
                                                    <option value="En Proceso">En Proceso</option>
                                                    <option value="Cubierta">Cubierta</option>
                                                    <option value="Cancelada">Cancelada</option>
                                                    <option value="Suspendida">Suspendida</option>
                                                </select>
                                            ) : (
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter",
                                                    v.estado === 'Cubierta' ? "bg-green-500/10 text-green-500" :
                                                        v.estado === 'Abierta' ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {v.estado}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-500">{new Date(v.fecha_apertura).toLocaleDateString()}</td>
                                        <td className="p-4 text-xs text-gray-500">{new Date(v.fecha_cierre_estimada).toLocaleDateString()}</td>
                                        <td className="p-4 text-xs">
                                            {editingVacancyId === v.id ? (
                                                <input
                                                    type="date"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none"
                                                    value={vacancyEditForm.fecha_cierre_real?.substring(0, 10) || ''}
                                                    onChange={(e) => setVacancyEditForm({ ...vacancyEditForm, fecha_cierre_real: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-gray-400">{v.fecha_cierre_real ? new Date(v.fecha_cierre_real).toLocaleDateString() : '—'}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 font-bold text-xs",
                                                calculateDesfase(v) > 30 ? "text-red-400" : calculateDesfase(v) > 15 ? "text-amber-400" : "text-green-400"
                                            )}>
                                                <Clock size={12} />
                                                {calculateDesfase(v)} días
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-400">{v.dias_sla_meta || 15}d</td>
                                        <td className="p-4">
                                            {editingVacancyId === v.id ? (
                                                <input
                                                    type="number"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-24"
                                                    value={vacancyEditForm.costo_vacante || 0}
                                                    onChange={(e) => setVacancyEditForm({ ...vacancyEditForm, costo_vacante: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 font-mono">${new Intl.NumberFormat().format(v.costo_vacante || 0)}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {editingVacancyId === v.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleVacancySave(v.id)} className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20"><Check size={14} /></button>
                                                    <button onClick={() => setEditingVacancyId(null)} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleVacancyEdit(v)} className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CANDIDATES TABLE */}
            <div className="space-y-4 pt-10">
                <div className="flex items-center gap-2 text-gray-400 ml-2">
                    <Users size={16} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Seguimiento de Candidatos (Eficacia)</h3>
                </div>
                <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto overflow-y-auto max-h-[50vh] custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1500px]">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#0d1117] border-b border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="p-4 whitespace-nowrap">Nombre Candidato</th>
                                    <th className="p-4 whitespace-nowrap">Vacante</th>
                                    <th className="p-4 whitespace-nowrap">Etapa</th>
                                    <th className="p-4 whitespace-nowrap">Fuente</th>
                                    <th className="p-4 whitespace-nowrap">HV / CV</th>
                                    <th className="p-4 whitespace-nowrap">Etdo. Entrevista</th>
                                    <th className="p-4 whitespace-nowrap">Fecha Entrevista</th>
                                    <th className="p-4 whitespace-nowrap">Resultado</th>
                                    <th className="p-4 whitespace-nowrap">Motivo No Apto</th>
                                    <th className="p-4 whitespace-nowrap">Score Técnico</th>
                                    <th className="p-4 whitespace-nowrap">Estatus 90 Días</th>
                                    <th className="p-4 whitespace-nowrap text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {candidatos.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 font-bold text-white text-sm">{c.nombre_candidato}</td>
                                        <td className="p-4 text-xs text-gray-400">
                                            <div className="truncate max-w-[150px]">{(c as any).puesto_nombre}</div>
                                            <div className="text-[10px] text-gray-600">{(c as any).codigo_requisicion}</div>
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.etapa_actual}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, etapa_actual: e.target.value })}
                                                >
                                                    <option>Postulación</option>
                                                    <option>Entrevista RH</option>
                                                    <option>Prueba Técnica</option>
                                                    <option>Entrevista Técnica</option>
                                                    <option>Entrevista Final</option>
                                                    <option>Oferta</option>
                                                    <option>Contratado</option>
                                                    <option>Descartado</option>
                                                </select>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-tight">
                                                    {c.etapa_actual}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.fuente_reclutamiento}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, fuente_reclutamiento: e.target.value })}
                                                >
                                                    <option>LinkedIn</option>
                                                    <option>Computrabajo</option>
                                                    <option>Referido</option>
                                                    <option>SENA</option>
                                                    <option>Volanteo</option>
                                                    <option>Otras Redes</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">{c.fuente_reclutamiento}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.cv_url || ''}
                                                    placeholder="URL Hoja de Vida"
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, cv_url: e.target.value })}
                                                />
                                            ) : (
                                                c.cv_url ? (
                                                    <a href={c.cv_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-[10px]">
                                                        Ver CV
                                                    </a>
                                                ) : <span className="text-gray-600 text-[10px]">Sin CV</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.estado_entrevista}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, estado_entrevista: e.target.value as any })}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="En Curso">En Curso</option>
                                                    <option value="Realizada">Realizada</option>
                                                    <option value="No Asistió">No Asistió</option>
                                                </select>
                                            ) : (
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                                                    c.estado_entrevista === 'Realizada' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-gray-400"
                                                )}>{c.estado_entrevista}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs">
                                            {editingCandidatoId === c.id ? (
                                                <input
                                                    type="date"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none"
                                                    value={candidatoEditForm.fecha_entrevista?.substring(0, 10) || ''}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, fecha_entrevista: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-gray-500">{c.fecha_entrevista ? new Date(c.fecha_entrevista).toLocaleDateString() : '—'}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.resultado_candidato || ''}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, resultado_candidato: e.target.value as any })}
                                                >
                                                    <option value="">Pendiente</option>
                                                    <option value="Apto">Apto</option>
                                                    <option value="No Apto">No Apto</option>
                                                    <option value="En Reserva">En Reserva</option>
                                                </select>
                                            ) : (
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                                                    c.resultado_candidato === 'Apto' ? "bg-blue-500/10 text-blue-500" :
                                                        c.resultado_candidato === 'No Apto' ? "bg-red-500/10 text-red-500" : "bg-white/5 text-gray-500"
                                                )}>{c.resultado_candidato || 'Pendiente'}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.motivo_no_apto || ''}
                                                    placeholder="Ej: Falta experiencia"
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, motivo_no_apto: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-500 truncate block max-w-[150px]">{c.motivo_no_apto || '—'}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    max="5"
                                                    min="0"
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-16"
                                                    value={candidatoEditForm.calificacion_tecnica || 0}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, calificacion_tecnica: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        (c.calificacion_tecnica || 0) >= 4 ? "text-green-500" : (c.calificacion_tecnica || 0) >= 3 ? "text-amber-500" : "text-red-500"
                                                    )}>{c.calificacion_tecnica || '0.0'}</span>
                                                    <span className="text-[10px] text-gray-600">/ 5.0</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingCandidatoId === c.id ? (
                                                <select
                                                    className="bg-[#0d1117] border border-white/10 rounded h-8 px-2 text-xs text-white outline-none w-full"
                                                    value={candidatoEditForm.estatus_90_dias || ''}
                                                    onChange={(e) => setCandidatoEditForm({ ...candidatoEditForm, estatus_90_dias: e.target.value as any })}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="Continúa">Continúa</option>
                                                    <option value="Retiro Voluntario">Retiro Voluntario</option>
                                                    <option value="Retiro por Desempeño">Retiro por Desempeño</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">{c.estatus_90_dias || '—'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {editingCandidatoId === c.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleCandidatoSave(c.id)} className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20"><Check size={14} /></button>
                                                    <button onClick={() => setEditingCandidatoId(null)} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleCandidatoEdit(c)} className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {candidatos.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-gray-600 italic text-sm">No hay candidatos registrados para seguimiento.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL REGISTRAR CANDIDATO */}
            {isAddingCandidato && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c10]/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0d1117]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Plus className="text-indigo-500" />
                                Registrar Nuevo Candidato
                            </h3>
                            <button onClick={() => setIsAddingCandidato(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCandidato} className="p-8 space-y-8">
                            <PremiumInput
                                label="Nombre Completo"
                                value={newCandidato.nombre_candidato}
                                onChange={(e: any) => setNewCandidato({ ...newCandidato, nombre_candidato: e.target.value })}
                                required
                            />

                            <PremiumSelect
                                label="Vacante a Postular"
                                value={newCandidato.vacante_id}
                                onChange={(e: any) => setNewCandidato({ ...newCandidato, vacante_id: Number(e.target.value) })}
                                options={vacantes.map(v => ({ value: v.id, label: `${v.puesto_nombre} (${v.codigo_requisicion})` }))}
                                required
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <PremiumSelect
                                    label="Fuente"
                                    value={newCandidato.fuente_reclutamiento}
                                    onChange={(e: any) => setNewCandidato({ ...newCandidato, fuente_reclutamiento: e.target.value })}
                                    options={[
                                        { value: 'LinkedIn', label: 'LinkedIn' },
                                        { value: 'Computrabajo', label: 'Computrabajo' },
                                        { value: 'Referido', label: 'Referido' },
                                        { value: 'SENA', label: 'SENA' },
                                        { value: 'Volanteo', label: 'Volanteo' }
                                    ]}
                                />
                                <PremiumInput
                                    label="Salario Pretendido"
                                    type="number"
                                    value={newCandidato.salario_pretendido}
                                    onChange={(e: any) => setNewCandidato({ ...newCandidato, salario_pretendido: Number(e.target.value) })}
                                />
                            </div>

                            <PremiumInput
                                label="URL Hoja de Vida (CV)"
                                value={newCandidato.cv_url}
                                onChange={(e: any) => setNewCandidato({ ...newCandidato, cv_url: e.target.value })}
                            />

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCandidato(false)}
                                    className="flex-1 h-12 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-12 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Guardar Candidato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataView;
