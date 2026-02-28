import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Globe, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Navigation Context Banner
 * Displays at the top of pages to help users understand where they are
 * and provide quick navigation between Public Portal and Administrative Dashboard
 */
const NavigationBanner: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isInPortal = location.pathname.startsWith('/portal');
    const isInAdmin = !isInPortal;

    // Don't show on login/register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <div className={cn(
            "sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300",
            isInPortal
                ? "bg-slate-900/80 border-white/5"
                : "bg-[#0a0c10]/90 border-white/5"
        )}>
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                {/* Current Context Indicator */}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        isInPortal ? "bg-blue-500" : "bg-emerald-500"
                    )}></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {isInPortal ? "Portal Público" : "Panel Administrativo"}
                    </span>
                </div>

                {/* Quick Navigation Toggle */}
                <div className="flex items-center gap-3">
                    {isInAdmin && (
                        <button
                            onClick={() => navigate('/portal')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg transition-all text-blue-400 text-xs font-medium group"
                        >
                            <Globe size={14} />
                            <span>Ir al Portal Público</span>
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    {isInPortal && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-lg transition-all text-emerald-400 text-xs font-medium group"
                        >
                            <LayoutDashboard size={14} />
                            <span>Ir al Dashboard</span>
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavigationBanner;
