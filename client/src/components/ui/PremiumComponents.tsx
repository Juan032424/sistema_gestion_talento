import React from 'react';
import { ChevronRight } from 'lucide-react';

export const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
    <div className={`flex items-center gap-3 ${color} mb-4`}>
        <div className="p-2 bg-white/5 rounded-lg backdrop-blur-sm shadow-inner">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
    </div>
);

export const PremiumInput = ({ label, icon, ...props }: any) => (
    <div className={`input-group-premium group ${props.containerClassName || ''}`}>
        <input
            {...props}
            placeholder=" "
            className={`input-premium peer ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${props.className || ''}`}
        />
        <label className="label-premium flex items-center gap-2">
            {label}
        </label>
        {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 peer-focus:text-[#3a94cc] transition-colors pointer-events-none">
                {icon}
            </div>
        )}
    </div>
);

export const PremiumSelect = ({ label, options, icon, ...props }: any) => (
    <div className={`input-group-premium group ${props.containerClassName || ''}`}>
        <select {...props} className={`input-premium peer appearance-none cursor-pointer ${props.className || ''}`}>
            {!props.value && <option value=""></option>}
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        <label className="label-premium flex items-center gap-2">
            {label}
        </label>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-focus-within:text-[#3a94cc] transition-colors">
            {icon || <ChevronRight className="rotate-90" size={16} />}
        </div>
    </div>
);
