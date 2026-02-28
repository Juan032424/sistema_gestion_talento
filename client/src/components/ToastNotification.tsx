import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={cn(
                            "min-w-[300px] p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-full duration-300",
                            toast.type === 'success' ? "bg-[#0d1117] border-green-500/20 text-white" :
                                toast.type === 'error' ? "bg-[#0d1117] border-red-500/20 text-white" :
                                    "bg-[#0d1117] border-blue-500/20 text-white"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center bg-opacity-20",
                            toast.type === 'success' ? "bg-green-500 text-green-500" :
                                toast.type === 'error' ? "bg-red-500 text-red-500" :
                                    "bg-blue-500 text-blue-500"
                        )}>
                            {toast.type === 'success' ? <CheckCircle2 size={16} /> :
                                toast.type === 'error' ? <AlertCircle size={16} /> :
                                    <Info size={16} />}
                        </div>
                        <div className="flex-1 text-sm font-medium">{toast.message}</div>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
