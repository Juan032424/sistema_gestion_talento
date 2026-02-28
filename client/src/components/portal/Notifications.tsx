import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, Info, ChevronRight, Filter } from 'lucide-react';

interface Notification {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'success' | 'warning' | 'error';
    leida: boolean;
    fecha: string;
    link_accion?: string;
}

// Datos de ejemplo
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        titulo: 'Bienvenido al Portal',
        mensaje: 'Gracias por registrarte. Completa tu perfil para tener mejores oportunidades.',
        tipo: 'success',
        leida: false,
        fecha: new Date().toISOString(),
        link_accion: '/portal/profile'
    },
    {
        id: 2,
        titulo: 'Nuevas vacantes para ti',
        mensaje: 'Hemos encontrado 3 nuevas vacantes que coinciden con tu perfil.',
        tipo: 'info',
        leida: true,
        fecha: new Date(Date.now() - 86400000).toISOString(),
        link_accion: '/portal'
    }
];

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const unreadCount = notifications.filter(n => !n.leida).length;

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return `Hace ${Math.floor(diffDays / 7)} semanas`;
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'success': return <CheckCircle size={20} className="text-green-400" />;
            case 'warning': return <Clock size={20} className="text-yellow-400" />;
            case 'error': return <Info size={20} className="text-red-400" />;
            default: return <Info size={20} className="text-blue-400" />;
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Notificaciones</h1>
                        <p className="text-gray-400">Mantente al día con tus procesos</p>
                    </div>

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'unread'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            No leídas
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {notifications
                        .filter(n => filter === 'all' || !n.leida)
                        .map((notification) => (
                            <div
                                key={notification.id}
                                className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${notification.leida
                                    ? 'bg-slate-900/40 border-white/5 hover:border-white/10'
                                    : 'bg-slate-900/80 border-blue-500/30 shadow-lg shadow-blue-500/5 hover:border-blue-500/50'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 p-2 rounded-xl h-fit ${notification.leida ? 'bg-white/5' : 'bg-blue-500/10'
                                        }`}>
                                        {getIcon(notification.tipo)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-semibold ${notification.leida ? 'text-gray-300' : 'text-white'
                                                }`}>
                                                {notification.titulo}
                                            </h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                                {getTimeAgo(notification.fecha)}
                                            </span>
                                        </div>

                                        <p className="text-gray-400 text-sm mb-3">
                                            {notification.mensaje}
                                        </p>

                                        {notification.link_accion && (
                                            <a
                                                href={notification.link_accion}
                                                className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium group"
                                            >
                                                Ver detalles
                                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        )}
                                    </div>

                                    {!notification.leida && (
                                        <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        ))}

                    {notifications.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                                <Bell size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No tienes notificaciones</h3>
                            <p className="text-gray-400">Te avisaremos cuando haya novedades importantes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
