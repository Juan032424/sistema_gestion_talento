import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
    Shield, Trash2, RefreshCw, Settings, Users,
    Activity, AlertTriangle, CheckCircle, XCircle,
    Download, BarChart3, Server, Key, Globe, Lock,
    Briefcase, UserX, FileText, Zap, Link, ExternalLink,
    Search, Edit, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useToast } from './ToastNotification';
import { useConfirm } from './ui/ConfirmModal';

interface SystemStats {
    total_users: number;
    total_vacantes: number;
    total_candidatos: number;
    total_applications: number;
    active_vacantes: number;
}

interface User {
    id: number;
    full_name: string;
    email: string;
    role_name: string;
    status: string;
    created_at: string;
    tenant_name?: string;
}

interface Vacante {
    id: number;
    puesto_nombre: string;
    estado: string;
    codigo_requisicion: string;
    responsable_rh: string;
    fecha_apertura: string;
}

interface LogEntry {
    id: number;
    user_email: string;
    entity_name: string;
    entity_id: string;
    action: string;
    changes: any;
    ip_address: string;
    created_at: string;
}

type Tab = 'overview' | 'users' | 'vacantes' | 'candidatos' | 'logs' | 'tracking' | 'settings';

const SuperAdminPanel: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [candidatos, setCandidatos] = useState<any[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [trackingLinks, setTrackingLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number | string; name: string } | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('');

    // Only Superadmin can access
    if (user?.role !== 'Superadmin') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Lock size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white">Acceso Restringido</h2>
                    <p className="text-gray-500 text-sm mt-2">Solo Superadmin puede acceder a este panel.</p>
                </div>
            </div>
        );
    }

    const fetchStats = useCallback(async () => {
        try {
            const [usersRes, vacantesRes, candidatosRes] = await Promise.all([
                api.get('/users'),
                api.get('/vacantes'),
                api.get('/candidatos'),
            ]);
            // Get application count separately with correct endpoint
            let appsCount = 0;
            try {
                const appsRes = await api.get('/applications/stats');
                appsCount = appsRes.data?.total_applications || appsRes.data?.total || 0;
            } catch { /* endpoint may not be accessible, ignore */ }

            setStats({
                total_users: usersRes.data?.length || 0,
                total_vacantes: vacantesRes.data?.length || 0,
                total_candidatos: candidatosRes.data?.length || 0,
                total_applications: appsCount,
                active_vacantes: (vacantesRes.data || []).filter((v: any) => v.estado === 'Abierta').length,
            });
        } catch (err) {
            console.error('Error fetching stats', err);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data || []);
        } catch (err) {
            showToast('Error cargando usuarios', 'error');
        } finally { setLoading(false); }
    }, []);

    const fetchVacantes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/vacantes');
            setVacantes(res.data || []);
        } catch (err) {
            showToast('Error cargando vacantes', 'error');
        } finally { setLoading(false); }
    }, []);

    const fetchCandidatos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/candidatos');
            setCandidatos(res.data || []);
        } catch (err) {
            showToast('Error cargando candidatos', 'error');
        } finally { setLoading(false); }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/audit/logs');
            setLogs(Array.isArray(res.data) ? res.data.slice(0, 200) : []);
        } catch {
            showToast('Error cargando logs de auditoría', 'error');
            setLogs([]);
        } finally { setLoading(false); }
    }, []);

    const fetchTrackingLinks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/tracking/admin/links');
            setTrackingLinks(res.data || []);
        } catch {
            showToast('Error cargando los links generados', 'error');
            setTrackingLinks([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchStats();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'vacantes') fetchVacantes();
        if (activeTab === 'candidatos') fetchCandidatos();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'tracking') fetchTrackingLinks();
    }, [activeTab]);

    const handleDeleteUser = async (id: number) => {
        try {
            await api.delete(`/users/${id}`);
            showToast('✅ Usuario eliminado', 'success');
            setUsers(u => u.filter(x => x.id !== id));
            fetchStats();
        } catch {
            showToast('No se puede eliminar este usuario', 'error');
        } finally { setConfirmDelete(null); }
    };

    const handleDeleteVacante = async (id: number) => {
        try {
            await api.delete(`/vacantes/${id}`);
            showToast('✅ Vacante eliminada', 'success');
            setVacantes(v => v.filter(x => x.id !== id));
            fetchStats();
        } catch {
            showToast('Error al eliminar vacante', 'error');
        } finally { setConfirmDelete(null); }
    };

    const handleDeleteCandidato = async (id: number) => {
        try {
            await api.delete(`/candidatos/${id}`);
            showToast('✅ Candidato eliminado', 'success');
            setCandidatos(c => c.filter(x => x.id !== id));
            fetchStats();
        } catch {
            showToast('Error al eliminar candidato', 'error');
        } finally { setConfirmDelete(null); }
    };

    const handleDeleteLink = async (token: string) => {
        try {
            await api.delete(`/tracking/admin/links/${token}`);
            showToast('✅ Link revocado exitosamente', 'success');
            setTrackingLinks(l => l.filter(x => x.tracking_token !== token));
        } catch {
            showToast('Error al revocar el link', 'error');
        } finally { setConfirmDelete(null); }
    };

    const confirmModal = useConfirm();

    const handleToggleVacanteState = async (v: Vacante) => {
        if (v.estado !== 'Cubierta') return;

        const ok = await confirmModal({
            title: 'Reabrir Vacante',
            message: `¿Estás seguro de reabrir la vacante "${v.puesto_nombre}"? Esto la marcará como activa nuevamente.`,
            confirmText: 'Reabrir',
            variant: 'info',
        });
        if (!ok) return;

        try {
            await api.put(`/vacantes/${v.id}`, { estado: 'Abierta', fecha_cierre_real: null });
            showToast('✅ Vacante reabierta exitosamente', 'success');
            fetchVacantes();
            fetchStats();
        } catch {
            showToast('Error al reabrir la vacante', 'error');
        }
    };

    const handleToggleUser = async (u: User) => {
        try {
            const newStatus = u.status === 'active' ? 'inactive' : 'active';
            await api.put(`/users/${u.id}/status`, { status: newStatus });
            showToast(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}`, 'success');
            fetchUsers();
        } catch {
            showToast('Error al cambiar estado', 'error');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingUser || !editRole) return;
        try {
            await api.patch(`/users/${editingUser.id}/role`, { role: editRole });
            showToast('✅ Rol actualizado', 'success');
            fetchUsers();
            setEditingUser(null);
        } catch {
            showToast('Error al actualizar rol', 'error');
        }
    };

    const handleDeleteConfirm = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'user') handleDeleteUser(confirmDelete.id as number);
        if (confirmDelete.type === 'vacante') handleDeleteVacante(confirmDelete.id as number);
        if (confirmDelete.type === 'candidato') handleDeleteCandidato(confirmDelete.id as number);
        if (confirmDelete.type === 'link') handleDeleteLink(confirmDelete.id as string);
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredVacantes = vacantes.filter(v =>
        v.puesto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.codigo_requisicion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredCandidatos = candidatos.filter(c =>
        c.nombre_candidato?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Resumen', icon: <BarChart3 size={15} /> },
        { id: 'users', label: 'Usuarios', icon: <Users size={15} /> },
        { id: 'vacantes', label: 'Vacantes', icon: <Briefcase size={15} /> },
        { id: 'candidatos', label: 'Candidatos', icon: <UserX size={15} /> },
        { id: 'logs', label: 'Auditoría', icon: <Activity size={15} /> },
        { id: 'tracking', label: 'Links Magic', icon: <Link size={15} /> },
        { id: 'settings', label: 'Sistema', icon: <Settings size={15} /> },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <Shield size={24} className="text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            Gestión del Sistema
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                Superadmin
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm">Control total sobre usuarios, datos y configuración del sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchStats(); if (activeTab === 'users') fetchUsers(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                >
                    <RefreshCw size={13} />
                    Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 border border-white/5 rounded-2xl p-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: OVERVIEW ─── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Usuarios', value: stats?.total_users ?? '—', icon: <Users size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                            { label: 'Vacantes', value: stats?.total_vacantes ?? '—', icon: <Briefcase size={20} />, color: 'text-blue-400', bg: 'bg-[#055098]/10 border-[#055098]/20' },
                            { label: 'Vacantes Abiertas', value: stats?.active_vacantes ?? '—', icon: <Globe size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                            { label: 'Candidatos', value: stats?.total_candidatos ?? '—', icon: <UserX size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                            { label: 'Postulaciones', value: stats?.total_applications ?? '—', icon: <FileText size={20} />, color: 'text-blue-400', bg: 'bg-[#055098]/10 border-[#055098]/20' },
                        ].map((s, i) => (
                            <div key={i} className={`bg-slate-900 border rounded-2xl p-4 ${s.bg}`}>
                                <div className={`mb-3 ${s.color}`}>{s.icon}</div>
                                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-gray-500 text-xs mt-1 font-medium">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                            <Zap size={16} className="text-amber-400" />
                            Acciones Rápidas
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Ver Usuarios', tab: 'users' as Tab, icon: <Users size={16} />, color: 'text-blue-400' },
                                { label: 'Ver Vacantes', tab: 'vacantes' as Tab, icon: <Briefcase size={16} />, color: 'text-blue-300' },
                                { label: 'Ver Candidatos', tab: 'candidatos' as Tab, icon: <UserX size={16} />, color: 'text-amber-400' },
                                { label: 'Ver Auditoría', tab: 'logs' as Tab, icon: <Activity size={16} />, color: 'text-emerald-400' },
                                { label: 'Ver Links', tab: 'tracking' as Tab, icon: <Link size={16} />, color: 'text-blue-300' },
                            ].map((a, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(a.tab)}
                                    className={`flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold ${a.color} hover:bg-white/10 transition-all`}
                                >
                                    {a.icon}
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                            <Server size={16} className="text-emerald-400" />
                            Estado del Sistema
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Backend API (Render)', status: true, url: 'sistema-gestion-talento.onrender.com' },
                                { label: 'Base de Datos (Railway)', status: true, url: 'interchange.proxy.rlwy.net:57434' },
                                { label: 'Frontend (Vercel)', status: true, url: 'gh-score.vercel.app' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        {s.status
                                            ? <CheckCircle size={16} className="text-emerald-400" />
                                            : <XCircle size={16} className="text-red-400" />}
                                        <span className="text-sm font-bold text-white">{s.label}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono hidden md:block">{s.url}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {s.status ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: USERS ─── */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-white/5 rounded-xl px-3 py-2.5">
                            <Search size={15} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-gray-500" /></div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest bg-slate-950">
                                            <th className="px-4 py-3">Usuario</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Rol</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-[#055098] flex items-center justify-center text-xs font-bold shrink-0">
                                                            {u.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-sm font-bold text-white">{u.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {u.role_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${u.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        {u.status === 'active' ? '● Activo' : '○ Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Toggle active */}
                                                        <button
                                                            onClick={() => handleToggleUser(u)}
                                                            title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                                                            className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                                                        >
                                                            {u.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                                        </button>
                                                        {/* Edit role */}
                                                        <button
                                                            onClick={() => { setEditingUser(u); setEditRole(u.role_name); }}
                                                            title="Cambiar rol"
                                                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        {/* Delete */}
                                                        {u.id !== user?.id && (
                                                            <button
                                                                onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.full_name })}
                                                                title="Eliminar usuario"
                                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: VACANTES ─── */}
            {activeTab === 'vacantes' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-slate-800 border border-white/5 rounded-xl px-3 py-2.5">
                        <Search size={15} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar vacante..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-600"
                        />
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-gray-500" /></div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest bg-slate-950">
                                            <th className="px-4 py-3">Código</th>
                                            <th className="px-4 py-3">Puesto</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Responsable</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredVacantes.map(v => (
                                            <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-xs font-mono text-gray-500">{v.codigo_requisicion}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-white">{v.puesto_nombre}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => v.estado === 'Cubierta' ? handleToggleVacanteState(v) : undefined}
                                                        className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-all ${v.estado === 'Abierta'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 cursor-pointer'
                                                            }`}
                                                        title={v.estado === 'Cubierta' ? 'Clic para reabrir la vacante' : ''}
                                                    >
                                                        {v.estado}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400">{v.responsable_rh || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setConfirmDelete({ type: 'vacante', id: v.id, name: v.puesto_nombre })}
                                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Eliminar vacante"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: CANDIDATOS ─── */}
            {activeTab === 'candidatos' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-slate-800 border border-white/5 rounded-xl px-3 py-2.5">
                        <Search size={15} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar candidato..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-600"
                        />
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-gray-500" /></div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest bg-slate-950">
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredCandidatos.map((c: any) => (
                                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-sm font-bold text-white">{c.nombre_candidato}</td>
                                                <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.fuente_reclutamiento}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {c.etapa_actual || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setConfirmDelete({ type: 'candidato', id: c.id, name: c.nombre_candidato })}
                                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Eliminar candidato"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: LOGS / AUDIT ─── */}
            {activeTab === 'logs' && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <Activity size={15} className="text-emerald-400" />
                            Auditoría de Acciones Forenses
                        </h3>
                        <span className="text-xs text-gray-500">{logs.length} eventos</span>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-gray-500" /></div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center text-gray-600 text-sm italic">No hay registros de auditoría disponibles</div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-xs min-w-[800px]">
                                <thead className="sticky top-0 bg-slate-950 border-b border-white/5">
                                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest">
                                        <th className="px-4 py-2">Fecha/Hora</th>
                                        <th className="px-4 py-2">Usuario (Responsable)</th>
                                        <th className="px-4 py-2">Módulo Afectado</th>
                                        <th className="px-4 py-2">Acción</th>
                                        <th className="px-4 py-2">Detalle JSON</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03] font-mono">
                                    {logs.map((log, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                {log.created_at ? new Date(log.created_at).toLocaleString('es-CO') : '—'}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="font-bold text-blue-400">
                                                    {log.user_email || 'Sistema (Auto)'}
                                                </span>
                                                <div className="text-[9px] text-gray-600 mt-0.5">{log.ip_address || 'IP Oculta'}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="text-white font-bold">{log.entity_name}</span>
                                                <span className="text-gray-500 ml-1">#{log.entity_id}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                                    log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-400' :
                                                    log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="text-[9px] text-gray-500 bg-slate-950 p-2 rounded-lg border border-white/5 max-w-[300px] overflow-x-auto">
                                                    {JSON.stringify(log.changes)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: TRACKING LINKS ─── */}
            {activeTab === 'tracking' && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <Link size={15} className="text-blue-400" />
                            Control de Magic Links Generados
                        </h3>
                        <span className="text-xs text-gray-500">{trackingLinks.length} enlaces activos</span>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-gray-500" /></div>
                    ) : trackingLinks.length === 0 ? (
                        <div className="py-12 text-center text-gray-600 text-sm italic">No hay links de seguimiento generados todavía</div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-xs min-w-[1000px]">
                                <thead className="sticky top-0 bg-slate-950 border-b border-white/5">
                                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest">
                                        <th className="px-4 py-3">Fecha Emisión</th>
                                        <th className="px-4 py-3">Candidato / Vacante</th>
                                        <th className="px-4 py-3">Estado Tracking</th>
                                        <th className="px-4 py-3">Vistas</th>
                                        <th className="px-4 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03] font-mono">
                                    {trackingLinks.map((tl, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(tl.created_at).toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white text-sm">{tl.candidato_nombre}</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">
                                                    <span className="text-blue-300">REQ: {tl.codigo_requisicion}</span> - {tl.puesto_nombre}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {new Date(tl.expires_at) < new Date() ? (
                                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold text-[10px]">Expirado</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">Activo</span>
                                                )}
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                                    Token: <span className="text-blue-300 truncate max-w-[80px]">{tl.tracking_token.substring(0,8)}...</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md font-bold text-blue-400">
                                                        {tl.views_count}
                                                    </span>
                                                    {tl.last_viewed_at && (
                                                        <span className="text-[10px] text-gray-500" title="Última vista">
                                                            (Últ:{new Date(tl.last_viewed_at).toLocaleDateString()})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a 
                                                        href={tl.trackingUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#055098]/10 hover:bg-[#055098]/20 text-blue-400 border border-[#055098]/20 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        <ExternalLink size={12} /> Probar Link
                                                    </a>
                                                    <button
                                                        onClick={() => setConfirmDelete({ type: 'link', id: tl.tracking_token, name: `el link de ${tl.candidato_nombre}` })}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Revocar/Eliminar link"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: SETTINGS ─── */}
            {activeTab === 'settings' && (
                <div className="space-y-4">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                            <Key size={15} className="text-amber-400" />
                            Información del Sistema
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Aplicación', value: 'GH-SCORE PRO v3.0' },
                                { label: 'Backend URL', value: 'sistema-gestion-talento.onrender.com' },
                                { label: 'Base de Datos', value: 'Railway MySQL — sistema_gestion_talento' },
                                { label: 'Frontend', value: 'gh-score.vercel.app' },
                                { label: 'Usuario actual', value: `${user?.fullName} (${user?.role})` },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.label}</span>
                                    <span className="text-xs text-white font-mono">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-red-500/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-red-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={15} />
                            Zona de Peligro
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Estas acciones son irreversibles. Úsalas con extrema precaución.</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-white">Exportar base de datos completa</p>
                                    <p className="text-[10px] text-gray-500">Descarga un backup de todos los datos</p>
                                </div>
                                <button
                                    onClick={() => showToast('Función de backup en desarrollo', 'info')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 transition-all"
                                >
                                    <Download size={12} />
                                    Exportar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: CONFIRM DELETE ─── */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-base font-black text-white">¿Confirmar eliminación?</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            Estás a punto de eliminar permanentemente: <br />
                            <span className="text-white font-bold">"{confirmDelete.name}"</span>
                            <br />
                            <span className="text-red-400 text-xs">Esta acción no se puede deshacer.</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: EDIT ROLE ─── */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                            <Edit size={16} className="text-blue-400" />
                            Cambiar Rol — {editingUser.full_name}
                        </h3>
                        <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            {['Superadmin', 'Admin', 'Reclutador', 'Lider'].map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateRole}
                                className="flex-1 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm font-bold text-blue-400 hover:bg-blue-500/20 transition-all"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;

