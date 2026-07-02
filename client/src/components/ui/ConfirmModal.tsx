import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';

/**
 * ============================================
 * 🛡️ PREMIUM CONFIRM MODAL
 * Replaces native browser confirm() dialogs
 * with a cinematic, glassmorphism overlay
 * ============================================
 */

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current?.(false);
    };

    const variantConfig = {
        danger: {
            icon: <AlertTriangle size={28} />,
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-500',
            buttonBg: 'bg-red-500 hover:bg-red-600',
            ringColor: 'ring-red-500/20',
        },
        warning: {
            icon: <AlertTriangle size={28} />,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
            buttonBg: 'bg-amber-500 hover:bg-amber-600',
            ringColor: 'ring-amber-500/20',
        },
        info: {
            icon: <Info size={28} />,
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-500',
            buttonBg: 'bg-blue-500 hover:bg-blue-600',
            ringColor: 'ring-blue-500/20',
        },
    };

    const v = variantConfig[options.variant || 'warning'];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* MODAL OVERLAY */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                        onClick={handleCancel} 
                    />

                    {/* Modal Card */}
                    <div className={`relative w-full max-w-md rounded-2xl border p-8 shadow-2xl ring-4 ${v.ringColor} animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}
                         style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                        
                        {/* Close Button */}
                        <button 
                            onClick={handleCancel}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X size={18} />
                        </button>

                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl ${v.iconBg} ${v.iconColor} flex items-center justify-center mb-6`}>
                            {v.icon}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                            {options.title || 'Confirmar Acción'}
                        </h3>

                        {/* Message */}
                        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                            {options.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all hover:bg-white/10"
                                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
                            >
                                {options.cancelText || 'Cancelar'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all ${v.buttonBg} shadow-lg hover:shadow-xl active:scale-95`}
                            >
                                {options.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
