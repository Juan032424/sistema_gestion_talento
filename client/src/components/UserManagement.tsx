import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from './ToastNotification';
import { useAuth } from '../context/AuthProvider';
import {
    Plus,
    Mail,
    Shield,
    Lock,
    User,
    X,
    CheckCircle2,
    Calendar,
    Briefcase,
    Power,
    Key,
    AlertTriangle,
    Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useConfirm } from './ui/ConfirmModal';

interface UserData {
    id: number;
    email: string;
    full_name: string;
    role_name: string;
    status: string;
    created_at: string;
    tenant_name: string;
    avatar_url?: string | null;
    cedula?: string | null;
}

interface Role {
    id: number;
    name: string;
    description: string;
}

const ROLE_STYLES: Record<string, string> = {
    'Superadmin': 'bg-[#055098]/10 text-blue-400 border-[#055098]/20',
    'Admin': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Lider': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Reclutador': 'bg-green-500/10 text-green-400 border-green-500/20',
};

const UserManagement: React.FC = () => {
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resetPasswordModal, setResetPasswordModal] = useState<{ open: boolean; userId: number | null; userName: string }>({
        open: false, userId: null, userName: ''
    });
    const [newPassword, setNewPassword] = useState('');

    // Form state
    const [form, setForm] = useState({
        email: '',
        password: '',
        fullName: '',
        roleId: '',
        cedula: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
        fetchRoles();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
            showToast("Error al cargar usuarios", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/users/roles');
            setRoles(res.data);
        } catch (error) {
            console.error("Error fetching roles", error);
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!form.fullName.trim()) errors.fullName = 'El nombre es requerido';
        if (!form.cedula.trim()) errors.cedula = 'La cédula es requerida';
        if (!form.email.trim()) errors.email = 'El correo es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Correo inválido';
        if (!form.password) errors.password = 'La contraseña es requerida';
        if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres';
        if (!form.roleId) errors.roleId = 'Selecciona un rol';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await api.post('/users', form);
            showToast("✅ Usuario creado exitosamente", "success");
            setIsModalOpen(false);
            setForm({ email: '', password: '', fullName: '', roleId: '', cedula: '' });
            setFormErrors({});
            fetchData();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error al crear usuario";
            showToast(msg, "error");
        }
    };

    const confirm = useConfirm();

    const handleToggleStatus = async (userId: number, currentStatus: string, userName: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activar' : 'desactivar';

        const ok = await confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
            message: `¿Estás seguro de ${action} la cuenta de "${userName}"?`,
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            variant: newStatus === 'active' ? 'info' : 'danger',
        });
        if (!ok) return;

        try {
            await api.put(`/users/${userId}/status`, { status: newStatus });
            showToast(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`, 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Error al cambiar estado', 'error');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showToast('La contraseña debe tener mínimo 6 caracteres', 'error');
            return;
        }
        try {
            await api.put(`/users/${resetPasswordModal.userId}/password`, { newPassword });
            showToast('Contraseña actualizada exitosamente', 'success');
            setResetPasswordModal({ open: false, userId: null, userName: '' });
            setNewPassword('');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Error al restablecer contraseña', 'error');
        }
    };

    const handleUploadAvatar = async (userId: number, file: File | undefined) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await api.post(`/users/${userId}/avatar`, formData);
            showToast(res.data.message || 'Avatar actualizado exitosamente', 'success');
            fetchData(); // Reload users to show new avatar
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Error al subir avatar', 'error');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-[#055098]/20 border-t-[#055098] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-[#055098]/10 rounded-xl border border-[#055098]/20">
                            <Shield className="text-blue-400" size={20} />
                        </div>
                        Gestión de Usuarios Administrativos
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Control de acceso para Líderes de GH, Analistas, Admin y Gerencia
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-xs text-gray-400 font-bold">{users.length} usuarios</span>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#055098] to-[#04407a] text-white rounded-xl text-xs font-bold hover:from-[#04407a] hover:to-[#055098] transition-all duration-300 shadow-lg shadow-[#055098]/30"
                    >
                        <Plus size={14} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-white/8 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-4 pl-6">Usuario</th>
                                <th className="p-4">Correo Electrónico</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Empresa</th>
                                <th className="p-4">Fecha Creación</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative group/avatar">
                                                {u.avatar_url ? (
                                                    <img src={`http://localhost:3001${u.avatar_url}`} className="w-9 h-9 rounded-full object-cover border border-[#055098]/40 shadow-[0_0_15px_rgba(5,80,152,0.3)]" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#055098] to-[#04407a] flex items-center justify-center text-xs font-black text-white shadow-lg">
                                                        {u.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US'}
                                                    </div>
                                                )}
                                                
                                                <label className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer border border-white/20">
                                                    <Camera size={14} className="text-white" />
                                                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleUploadAvatar(u.id, e.target.files?.[0])} />
                                                </label>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{u.full_name}</p>
                                                {u.cedula && (
                                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">C.C. {u.cedula}</p>
                                                )}
                                                {u.id === (currentUser as any)?.id && (
                                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Tú</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Mail size={11} className="text-gray-600" />
                                            {u.email}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border",
                                            ROLE_STYLES[u.role_name] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        )}>
                                            {u.role_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={11} className="text-gray-600" />
                                            {u.tenant_name}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={11} className="text-gray-600" />
                                            {new Date(u.created_at).toLocaleDateString('es-CO')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={cn(
                                            "flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border w-fit",
                                            u.status === 'active'
                                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                : "text-red-400 bg-red-500/10 border-red-500/20"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", u.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                                            {u.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => setResetPasswordModal({ open: true, userId: u.id, userName: u.full_name })}
                                                className="p-2 text-gray-600 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                                                title="Cambiar contraseña"
                                            >
                                                <Key size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(u.id, u.status, u.full_name)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all",
                                                    u.status === 'active'
                                                        ? "text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                                                        : "text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                )}
                                                title={u.status === 'active' ? 'Desactivar usuario' : 'Activar usuario'}
                                            >
                                                <Power size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <User className="text-gray-700" size={40} />
                                            <p className="text-gray-600 italic text-sm">No hay usuarios administrativos creados.</p>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="text-xs text-[#055098] hover:underline font-bold"
                                            >
                                                Crear el primer usuario →
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===========================
                CREATE USER MODAL
            =========================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#055098]/20 to-transparent">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <div className="p-1.5 bg-[#055098]/20 rounded-lg border border-[#055098]/20">
                                    <Plus size={16} className="text-blue-400" />
                                </div>
                                Crear Nuevo Usuario
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setFormErrors({}); }}
                                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Nombre Completo *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User size={14} className="text-gray-600" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all",
                                            formErrors.fullName
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/8 focus:ring-[#055098]/25 focus:border-[#055098]/60 hover:border-white/15"
                                        )}
                                        placeholder="Ej: María Fernanda López"
                                        value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    />
                                </div>
                                {formErrors.fullName && <p className="text-red-400 text-[10px] mt-1 ml-1">{formErrors.fullName}</p>}
                            </div>

                            {/* Cédula */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Cédula de Identificación *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Shield size={14} className="text-gray-600" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all",
                                            formErrors.cedula
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/8 focus:ring-[#055098]/25 focus:border-[#055098]/60 hover:border-white/15"
                                        )}
                                        placeholder="Ej: 1047453422"
                                        value={form.cedula}
                                        onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                                    />
                                </div>
                                {formErrors.cedula && <p className="text-red-400 text-[10px] mt-1 ml-1">{formErrors.cedula}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Correo Electrónico *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={14} className="text-gray-600" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all",
                                            formErrors.email
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/8 focus:ring-[#055098]/25 focus:border-[#055098]/60 hover:border-white/15"
                                        )}
                                        placeholder="usuario@discol.com.co"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                {formErrors.email && <p className="text-red-400 text-[10px] mt-1 ml-1">{formErrors.email}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Rol Asignado *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Shield size={14} className="text-gray-600" />
                                    </div>
                                    <select
                                        required
                                        className={cn(
                                            "w-full pl-10 pr-10 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer",
                                            formErrors.roleId
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/8 focus:ring-[#055098]/25 focus:border-[#055098]/60 hover:border-white/15"
                                        )}
                                        value={form.roleId}
                                        onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                                    >
                                        <option value="" className="text-gray-500">-- Seleccionar rol --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {formErrors.roleId && <p className="text-red-400 text-[10px] mt-1 ml-1">{formErrors.roleId}</p>}
                                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">
                                    Los roles determinan el nivel de acceso al sistema.
                                </p>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Contraseña Inicial *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={14} className="text-gray-600" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all",
                                            formErrors.password
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/8 focus:ring-[#055098]/25 focus:border-[#055098]/60 hover:border-white/15"
                                        )}
                                        placeholder="Mínimo 6 caracteres"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                                {formErrors.password && <p className="text-red-400 text-[10px] mt-1 ml-1">{formErrors.password}</p>}
                                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">
                                    El usuario puede cambiar su contraseña después de iniciar sesión.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setFormErrors({}); setForm({ email: '', password: '', fullName: '', roleId: '', cedula: '' }); }}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/8 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#055098] to-[#04407a] text-white rounded-xl text-sm font-bold hover:from-[#04407a] hover:to-[#055098] transition-all duration-300 shadow-lg shadow-[#055098]/20"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===========================
                RESET PASSWORD MODAL
            =========================== */}
            {resetPasswordModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-amber-500/20 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-amber-500/5">
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-400" />
                                Cambiar Contraseña
                            </h3>
                            <button
                                onClick={() => { setResetPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); }}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-gray-400">
                                Estás cambiando la contraseña de: <strong className="text-white">{resetPasswordModal.userName}</strong>
                            </p>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={13} className="text-gray-600" />
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/60 transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setResetPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); }}
                                    className="flex-1 px-3 py-2.5 bg-white/5 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    className="flex-1 px-3 py-2.5 bg-amber-500/80 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

