import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import {
    LayoutDashboard,
    Layers,
    Search,
    Bell,
    ChevronRight,
    LogOut,
    Database,
    Settings,
    LineChart,
    Users,
    Zap,
    Trophy,
    Target,
    Shield,
    ClipboardList,
    Menu,
    X,
    Sun,
    Moon
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthProvider';
import WorkplaceAssistant from './WorkplaceAssistant';
import NavigationBanner from './NavigationBanner';
import AdminNotificationPanel from './AdminNotificationPanel';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const fetchUnreadCount = React.useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadNotifications(res.data.count);
        } catch (err) {
            console.error("Error fetching notification count", err);
        }
    }, []);

    React.useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    React.useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/search?q=${searchTerm}`);
                    setSearchResults(res.data.results);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Close sidebar when route changes (mobile)
    React.useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const userRole = user?.role || 'Guest';


    const allMenuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'Flujo Kanban', path: '/kanban', icon: Layers, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'Vacantes', path: '/vacantes', icon: Database, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'Candidatos', path: '/candidatos', icon: Users, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'AI Hub Agents', path: '/agents', icon: Zap, roles: ['Superadmin'] },
        { name: 'AI Sourcing', path: '/sourcing', icon: Target, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'Referidos Hub', path: '/referidos', icon: Trophy, roles: ['Superadmin', 'Admin', 'Reclutador', 'Lider'] },
        { name: 'Analíticas', path: '/analytics', icon: LineChart, roles: ['Superadmin', 'Admin', 'Lider'] },
        { name: 'Evaluaciones', path: '/evaluations', icon: ClipboardList, roles: ['Superadmin', 'Admin', 'Lider'] },
        { name: 'Sedes y Empresas', path: '/configuracion', icon: Settings, roles: ['Superadmin', 'Admin'] },
        { name: 'Gestión Usuarios', path: '/usuarios', icon: Shield, roles: ['Superadmin', 'Admin'] },
        { name: '⚙ Sistema', path: '/sistema', icon: Settings, roles: ['Superadmin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    const handleLogout = () => {
        const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (confirmed) {
            logout();
        }
    };

    const getUserInitials = () => {
        if (!user?.fullName) return 'AU';
        const names = user.fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return user.fullName.substring(0, 2).toUpperCase();
    };

    const SidebarContent = () => (
        <>
            <div className="p-4 pt-5 pb-3">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-full h-20 rounded-2xl flex items-center justify-center p-0 mb-3 border border-white/10 shadow-lg overflow-hidden group" style={{ backgroundColor: theme === 'light' ? '#fff' : '#000', borderColor: 'var(--border-color)' }}>
                        <img src="/logo_discol.png" alt="Discol Logo" className="w-full h-full object-contain px-4 transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <h1 className="text-sm font-black tracking-tighter text-white text-center">
                        GH-SCORE <span className="text-[#3a94cc] font-light">PRO</span>
                        <span className="block text-[7px] text-gray-500 font-normal tracking-widest mt-0.5">GLOBAL TALENT SUITE</span>
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4 flex items-center justify-between">
                    <span>Gestión de Talento</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="System Online"></span>
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn("sidebar-link group relative", isActive && "active")}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#3a94cc] rounded-r-full shadow-[0_0_10px_#3a94cc]" />
                            )}
                            <Icon size={20} className={cn(isActive ? "text-[#3a94cc]" : "text-gray-500 group-hover:text-gray-300")} />
                            <span className="font-medium text-sm">{item.name}</span>
                            {isActive && <ChevronRight size={14} className="ml-auto opacity-100 text-[#3a94cc]" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 pt-2 border-t border-white/5 space-y-3 bg-white/[0.02] backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-panel)' }}>
                <div className="mx-0 p-2.5 rounded-xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/5 relative overflow-hidden hidden md:block">
                    <div className="absolute top-0 right-0 p-1.5 opacity-30">
                        <Users size={24} className="text-white/5 -rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-black uppercase text-[#3a94cc] tracking-widest">Nivel 4</span>
                            <span className="text-[8px] text-gray-400 font-mono">2.4k XP</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full w-[75%] bg-gradient-to-r from-[#3a94cc] to-blue-400 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 px-1 py-0.5">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 shadow-lg shadow-blue-900/40">
                            {getUserInitials()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border rounded-full" style={{ borderColor: 'var(--bg-sidebar)' }}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate leading-none">{user?.fullName || 'Admin'}</p>
                        <p className="text-[9px] text-[#3a94cc] mt-0.5 font-medium">{user?.role || 'Admin'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                        className="text-gray-500 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg shrink-0 border border-white/5"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-main text-primary-text font-sans selection:bg-blue-500/30 overflow-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — hidden on mobile, shown via overlay */}
            <aside className={cn(
                "fixed lg:relative inset-y-0 left-0 z-50 w-64 border-r transition-transform duration-300 flex flex-col h-full",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )} style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <SidebarContent />
            </aside>

            {/* Main Container */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className="mesh-gradient" />

                {/* Navigation Context Banner */}
                <NavigationBanner />

                {/* Top Navbar */}
                <header className="h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 md:px-8 no-print sticky top-0 z-40 gap-3" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', opacity: 0.9 }}>

                    {/* Hamburger button — visible on mobile only */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Search Bar */}
                    <div className="relative group flex-1 max-w-lg">
                        <div className="flex items-center border rounded-xl px-3 py-2 w-full group-focus-within:border-[#3a94cc]/50 transition-all duration-300" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
                            <Search size={16} className={cn("text-gray-500 group-focus-within:text-[#3a94cc] transition-colors shrink-0", isSearching && "animate-pulse")} />
                            <input
                                type="text"
                                placeholder="Buscar vacantes, candidatos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                                className="bg-transparent border-none outline-none ml-2 text-sm w-full placeholder:text-gray-600 min-w-0"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>

                        {showDropdown && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setShowDropdown(false)} />
                                <div className="absolute top-full left-0 mt-3 w-full bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1">Resultados</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                        {searchResults.length > 0 ? searchResults.map((res, i) => (
                                            <Link
                                                key={i}
                                                to={res.type === 'vacante' ? '/data' : '/data'}
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer group"
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                    res.type === 'vacante' ? "bg-[#1e4b7a]/20 text-[#1e4b7a]" : "bg-[#3a94cc]/20 text-[#3a94cc]"
                                                )}>
                                                    <Search size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-white truncate">{res.label}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{res.sublabel} • {res.type}</div>
                                                </div>
                                                <ChevronRight size={14} className="ml-auto text-gray-600 shrink-0" />
                                            </Link>
                                        )) : (
                                            <div className="px-4 py-10 text-center">
                                                <Search size={24} className="text-gray-700 mx-auto mb-2" />
                                                <p className="text-gray-500 text-xs italic">Sin resultados para "{searchTerm}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Header Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-xl bg-[#161b22] border transition-all relative",
                                    showNotifications ? "border-blue-500/50 bg-blue-500/5 text-blue-400" : "border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Bell size={17} />
                                {unreadNotifications > 0 && (
                                    <>
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                                    </>
                                )}
                            </button>

                            {showNotifications && (
                                <AdminNotificationPanel
                                    onClose={() => setShowNotifications(false)}
                                    onRefreshCount={fetchUnreadCount}
                                />
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all border border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)' }}
                            title={theme === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                        >
                            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                        </button>

                        <button className="hidden md:block px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 border border-white/10 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                            Exportar
                        </button>

                        {/* Mobile close sidebar button when open */}
                        {sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1e4b7a]/5 blur-[120px] rounded-full -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#3a94cc]/5 blur-[120px] rounded-full -z-10" />
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>

            {/* AI Assistant FAB */}
            <WorkplaceAssistant />
        </div>
    );
};

export default Layout;
