import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WizardStep {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    isValid?: boolean;
}

interface WizardProgressProps {
    steps: WizardStep[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
    return (
        <div className="w-full px-2 py-6">
            <div className="flex items-center justify-between relative">
                {/* Connection line */}
                <div className="absolute top-5 left-0 right-0 h-px bg-white/10 z-0" />
                <div
                    className="absolute top-5 left-0 h-px bg-gradient-to-r from-indigo-500 to-indigo-400 z-0 transition-all duration-700"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const isClickable = onStepClick && (isCompleted || idx === currentStep + 0);

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center gap-2 z-10 relative"
                            style={{ flex: '0 0 auto' }}
                        >
                            <button
                                type="button"
                                onClick={() => isClickable && onStepClick?.(idx)}
                                disabled={!isClickable}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all duration-300 shadow-lg",
                                    isCompleted
                                        ? "bg-indigo-500 border-indigo-500 text-white cursor-pointer hover:scale-110"
                                        : isCurrent
                                            ? "bg-[#0d1117] border-indigo-500 text-indigo-400 scale-110 shadow-indigo-500/40 shadow-xl"
                                            : "bg-[#0d1117] border-white/10 text-gray-600 cursor-default"
                                )}
                            >
                                {isCompleted ? <Check size={16} /> : React.cloneElement(step.icon as React.ReactElement, { size: 16 })}
                            </button>
                            <div className="text-center hidden sm:block">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                    isCurrent ? "text-indigo-400" : isCompleted ? "text-gray-300" : "text-gray-600"
                                )}>
                                    {step.title}
                                </p>
                                <p className={cn(
                                    "text-[9px] tracking-wide whitespace-nowrap",
                                    isCurrent ? "text-gray-400" : "text-gray-600"
                                )}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface WizardNavigationProps {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onSubmit: () => void;
    isSubmitting?: boolean;
    canProceed?: boolean;
    isDraft?: boolean;
    onClearDraft?: () => void;
}

export function WizardNavigation({
    currentStep,
    totalSteps,
    onNext,
    onPrev,
    onSubmit,
    isSubmitting,
    canProceed = true,
    isDraft,
    onClearDraft,
}: WizardNavigationProps) {
    const isLast = currentStep === totalSteps - 1;

    return (
        <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-8">
            <div className="flex items-center gap-3">
                {currentStep > 0 && (
                    <button
                        type="button"
                        onClick={onPrev}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl border border-white/10"
                    >
                        ← Anterior
                    </button>
                )}
                {isDraft && onClearDraft && (
                    <button
                        type="button"
                        onClick={onClearDraft}
                        className="px-4 py-3 text-amber-500/60 hover:text-amber-400 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-amber-500/5 rounded-xl"
                    >
                        ✕ Limpiar borrador
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    Paso {currentStep + 1} de {totalSteps}
                </span>

                {isLast ? (
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting || !canProceed}
                        className={cn(
                            "relative overflow-hidden group px-10 py-3.5 rounded-xl font-bold text-white shadow-2xl transition-all text-xs uppercase tracking-widest",
                            isSubmitting || !canProceed
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:scale-105 active:scale-95"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all group-hover:scale-110" />
                        <div className="relative flex items-center gap-2">
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check size={16} />
                            )}
                            <span>{isSubmitting ? 'Guardando...' : 'Guardar Vacante'}</span>
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canProceed}
                        className={cn(
                            "relative overflow-hidden group px-10 py-3.5 rounded-xl font-bold text-white shadow-2xl transition-all text-xs uppercase tracking-widest",
                            !canProceed
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:scale-105 active:scale-95"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all group-hover:scale-110" />
                        <div className="relative flex items-center gap-2">
                            <span>Siguiente →</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

interface ValidationErrorProps {
    message: string;
}

export function FieldError({ message }: ValidationErrorProps) {
    if (!message) return null;
    return (
        <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {message}
        </p>
    );
}
