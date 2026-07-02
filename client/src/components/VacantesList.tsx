import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from './ToastNotification';
import type { Vacante } from '../types';
import {
    Filter,
    Edit2,
    Clock,
    Plus,
    Briefcase,
    Share2,
    CheckCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthProvider';
import { DataTable, type ColumnDef } from './ui/DataTable';
import { Skeleton, SkeletonTable } from './ui/Skeleton';

const VacantesList: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = React.useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const canCreateVacancy = user && ['Superadmin', 'Admin', 'Lider'].includes(user.role);

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

    const handleVacancyEdit = (v: Vacante) => {
        navigate(`/edit-vacante/${v.id}`);
    };

    const handleShareLink = (v: Vacante) => {
        const publicUrl = `${window.location.origin}/aplicar/${v.id}`;
        const fallbackCopy = () => {
            const el = document.createElement('textarea');
            el.value = publicUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast(`Link copiado: ${publicUrl}`, 'success');
            setCopiedId(v.id);
            setTimeout(() => setCopiedId(null), 3000);
        };

        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(publicUrl).then(() => {
                setCopiedId(v.id);
                showToast(`✅ Link copiado: /aplicar/${v.id}`, 'success');
                setTimeout(() => setCopiedId(null), 3000);
            }).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    };

    const calculateDesfase = (v: Vacante) => {
        const start = new Date(v.fecha_apertura);
        const end = v.fecha_cierre_real ? new Date(v.fecha_cierre_real) : new Date();
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const columns: ColumnDef<Vacante>[] = [
        {
            header: "Código REQ",
            accessorKey: "codigo_requisicion",
            sortable: true,
            className: "font-mono text-xs text-gray-400"
        },
        {
            header: "Puesto",
            accessorKey: "puesto_nombre",
            sortable: true,
            cell: (v) => <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">{v.puesto_nombre}</div>
        },
        {
            header: "Estado Cubrimiento",
            accessorKey: "estado",
            sortable: true,
            cell: (v) => (
                <span className={cn(
                    "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter",
                    v.estado === 'Cubierta' ? "bg-green-500/10 text-green-500" :
                        v.estado === 'Abierta' ? "bg-[#3a94cc]/10 text-[#3a94cc]" :
                            "bg-amber-500/10 text-amber-500"
                )}>
                    {v.estado}
                </span>
            )
        },
        {
            header: "Apertura",
            accessorKey: "fecha_apertura",
            sortable: true,
            className: "text-xs text-gray-500",
            cell: (v) => new Date(v.fecha_apertura).toLocaleDateString()
        },
        {
            header: "Cierre Estimado",
            accessorKey: "fecha_cierre_estimada",
            sortable: true,
            className: "text-xs text-gray-500",
            cell: (v) => new Date(v.fecha_cierre_estimada).toLocaleDateString()
        },
        {
            header: "Cierre Real",
            accessorKey: "fecha_cierre_real",
            sortable: true,
            className: "text-xs",
            cell: (v) => <span className="text-gray-400">{v.fecha_cierre_real ? new Date(v.fecha_cierre_real).toLocaleDateString() : '—'}</span>
        },
        {
            header: "Días Desfase",
            id: "desfase",
            sortable: false,
            className: "text-blue-400",
            cell: (v) => {
                const desfase = calculateDesfase(v);
                return (
                    <div className={cn(
                        "flex items-center gap-1.5 font-bold text-xs",
                        desfase > 30 ? "text-red-400" : desfase > 15 ? "text-amber-400" : "text-green-400"
                    )}>
                        <Clock size={12} />
                        {desfase} días
                    </div>
                );
            }
        },
        {
            header: "SLA Meta",
            accessorKey: "dias_sla_meta",
            sortable: true,
            className: "text-xs text-gray-400",
            cell: (v) => `${v.dias_sla_meta || 15}d`
        },
        {
            header: "Costo Vacante",
            accessorKey: "costo_vacante",
            sortable: true,
            cell: (v) => <span className="text-xs text-gray-400 font-mono">${new Intl.NumberFormat().format(v.costo_vacante || 0)}</span>
        },
        {
            header: "Acciones",
            id: "acciones",
            className: "text-right",
            cell: (v) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                    {canCreateVacancy && (
                        <button onClick={() => handleVacancyEdit(v)} className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>
            <SkeletonTable columns={8} rows={10} />
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
                    {canCreateVacancy && (
                        <button onClick={() => navigate('/create-vacante')} className="flex items-center gap-2 px-4 py-2 bg-[#1e4b7a] text-white rounded-xl text-xs font-bold hover:bg-[#3a94cc] transition-all shadow-lg shadow-[#1e4b7a]/20">
                            <Plus size={14} />
                            Nueva Vacante
                        </button>
                    )}
                </div>
            </div>

            <DataTable 
                data={vacantes} 
                columns={columns} 
                searchPlaceholder="Buscar vacantes por código, nombre o estado..."
                onRowClick={(v) => navigate(`/vacantes/${v.id}`)}
                emptyMessage="No hay vacantes registradas o que coincidan con la búsqueda."
            />
        </div>
    );
};

export default VacantesList;
