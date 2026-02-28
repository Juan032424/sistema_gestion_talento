import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from './ToastNotification';
import type { Vacante } from '../types';
import {
    Filter,
    Download,
    Edit2,
    Clock,
    Plus,
    Briefcase,
    Share2,
    CheckCheck
} from 'lucide-react';

import { cn } from '../lib/utils';

const VacantesList: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);

    // Vacante Edit State
    // const [editingVacancyId, setEditingVacancyId] = useState<number | null>(null);
    // const [vacancyEditForm, setVacancyEditForm] = useState<Partial<Vacante>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/vacantes');
            setVacantes(res.data);
        } catch (error) {
            console.error("Error fetching data", error);
            showToast("Error al cargar vacantes", "error");
        } finally {
            setLoading(false);
        }
    };

    // Vacancy actions
    const handleVacancyEdit = (v: Vacante) => {
        navigate(`/edit-vacante/${v.id}`);
    };

    const [copiedId, setCopiedId] = React.useState<number | null>(null);

    const handleShareLink = (v: Vacante) => {
        const publicUrl = `${window.location.origin}/aplicar/${v.id}`;
        navigator.clipboard.writeText(publicUrl).then(() => {
            setCopiedId(v.id);
            showToast(`✅ Link copiado: /aplicar/${v.id}`, 'success');
            setTimeout(() => setCopiedId(null), 3000);
        }).catch(() => {
            // Fallback for non-HTTPS
            const el = document.createElement('textarea');
            el.value = publicUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast(`Link copiado: ${publicUrl}`, 'success');
            setCopiedId(v.id);
            setTimeout(() => setCopiedId(null), 3000);
        });
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
                        <Briefcase className="text-[#3a94cc]" />
                        Gestión de Vacantes
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Control y seguimiento de requisiciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                        <Filter size={14} />
                        Filtros
                    </button>
                    <button onClick={() => navigate('/create-vacante')} className="flex items-center gap-2 px-4 py-2 bg-[#1e4b7a] text-white rounded-xl text-xs font-bold hover:bg-[#3a94cc] transition-all shadow-lg shadow-[#1e4b7a]/20">
                        <Plus size={14} />
                        Nueva Vacante
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                        <Download size={14} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* VACANCIES TABLE */}
            <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                                        <span className={cn(
                                            "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter",
                                            v.estado === 'Cubierta' ? "bg-green-500/10 text-green-500" :
                                                v.estado === 'Abierta' ? "bg-[#3a94cc]/10 text-[#3a94cc]" :
                                                    "bg-amber-500/10 text-amber-500"
                                        )}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">{new Date(v.fecha_apertura).toLocaleDateString()}</td>
                                    <td className="p-4 text-xs text-gray-500">{new Date(v.fecha_cierre_estimada).toLocaleDateString()}</td>
                                    <td className="p-4 text-xs">
                                        <span className="text-gray-400">{v.fecha_cierre_real ? new Date(v.fecha_cierre_real).toLocaleDateString() : '—'}</span>
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
                                        <span className="text-xs text-gray-400 font-mono">${new Intl.NumberFormat().format(v.costo_vacante || 0)}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {v.estado === 'Abierta' && (
                                                <button
                                                    onClick={() => handleShareLink(v)}
                                                    className="p-2 text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                    title={`Copiar link público: /aplicar/${v.id}`}
                                                >
                                                    {copiedId === v.id
                                                        ? <CheckCheck size={15} className="text-emerald-400" />
                                                        : <Share2 size={15} />}
                                                </button>
                                            )}
                                            <button onClick={() => handleVacancyEdit(v)} className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vacantes.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-gray-600 italic text-sm">No hay vacantes registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VacantesList;
