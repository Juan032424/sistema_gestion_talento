import React, { useState } from 'react';
import {
    Briefcase, LogOut, Home, Search,
    Bookmark, Bell, Target, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCandidateAuth } from '../context/CandidateAuthContext';
import { cn } from '../lib/utils';
import CandidateAuthModal from './portal/CandidateAuthModal';


interface PortalLayoutProps {
    children: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useCandidateAuth();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleLogout = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        logout();
        navigate('/portal');
    };

    const getInitials = (nombre: string) => {
        return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayUser = user || { nombre: 'Visitante del Portal', email: '' };

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/portal', id: 'inicio' },
        { icon: Search, label: 'Explorar', path: '/portal', id: 'explorar' },
        { icon: Bookmark, label: 'Guardados', path: '/portal/saved', id: 'guardados' },
        { icon: Bell, label: 'Notificaciones', path: '/portal/notifications', id: 'notificaciones' },
        { icon: Target, label: 'Mis Aplicaciones', path: '/portal/applications', id: 'aplicaciones' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
            <div className="mesh-gradient"></div>

            {/* Aerospace Grid Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                                       linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}>
            </div>



            <div className="flex h-screen relative z-10">
                {/* ========== SIDEBAR ========== */}
                <aside className={cn(
                    "transition-all duration-500 ease-in-out backdrop-blur-2xl bg-slate-900/40 border-r border-white/5 relative shrink-0",
                    sidebarCollapsed ? "w-20" : "w-72"
                )}>
                    <div className="relative h-full flex flex-col">
                        {/* Logo */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            {!sidebarCollapsed && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                                        <Briefcase size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white tracking-tight">DISCOL <span className="text-blue-400">PRO</span></h1>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">Portal de Talento</p>
                                    </div>
                                </div>
                            )}
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400">
                                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                        </div>

                        {/* Nav Menu */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                                        location.pathname === item.path ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon size={20} />
                                    {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                                </button>
                            ))}


                        </nav>

                        {/* User Identity */}
                        <div className="p-4 border-t border-white/5 bg-slate-900/60">
                            {!sidebarCollapsed ? (
                                <div className="space-y-3">
                                    <div
                                        onClick={() => !isAuthenticated && setShowAuthModal(true)}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold",
                                            isAuthenticated ? "ring-2 ring-green-500" : ""
                                        )}>
                                            {getInitials(displayUser.nombre)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{displayUser.nombre}</p>
                                            <p className="text-xs text-gray-400 truncate">{isAuthenticated ? displayUser.email : 'Invitado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {isAuthenticated && (
                                            <button
                                                onClick={(e) => handleLogout(e)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl transition-all text-red-400"
                                            >
                                                <LogOut size={16} />
                                                <span className="text-xs font-medium">Salir</span>
                                            </button>
                                        )}
                                        {!isAuthenticated && (
                                            <button
                                                onClick={() => setShowAuthModal(true)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-xl transition-all text-blue-400"
                                            >
                                                <LogOut size={16} className="rotate-180" />
                                                <span className="text-xs font-medium">Entrar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        onClick={() => !isAuthenticated && setShowAuthModal(true)}
                                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold cursor-pointer"
                                    >
                                        {getInitials(displayUser.nombre)}
                                    </div>
                                    {isAuthenticated && (
                                        <button onClick={(e) => handleLogout(e)} className="p-2 hover:bg-red-600/10 rounded-lg text-red-400">
                                            <LogOut size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>

            <CandidateAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
};

export default PortalLayout;
