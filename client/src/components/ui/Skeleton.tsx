import React from 'react';
import { cn } from '../../lib/utils'; // Assuming this utility exists based on Kanban.tsx imports

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/10", className)}
            {...props}
        />
    );
}

export function SkeletonTable({ columns = 5, rows = 5 }: { columns?: number, rows?: number }) {
  return (
    <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="w-full text-left">
        {/* Header Skeleton */}
        <div className="bg-[#0d1117] border-b border-white/10 flex px-4 py-4 gap-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={`h-${i}`} className="h-4 flex-1 bg-white/20" />
            ))}
        </div>
        {/* Rows Skeleton */}
        <div className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={`r-${r}`} className="flex px-4 py-5 gap-4">
                    {Array.from({ length: columns }).map((_, c) => (
                        <Skeleton key={`c-${c}`} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonKpiCard() {
    return (
        <div className="relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-[var(--bg-card)] border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between gap-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl bg-[#055098]/50" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <Skeleton className="h-14 flex-1 max-w-4xl rounded-[2.5rem]" />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonKpiCard key={i} />
                ))}
                <div className="relative overflow-hidden rounded-2xl border p-6 bg-[var(--bg-card)] border-[var(--border-color)]">
                    <Skeleton className="h-4 w-24 mb-6" />
                    <Skeleton className="h-3 w-full mb-4" />
                    <Skeleton className="h-3 w-full" />
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl flex items-start gap-4 border bg-[var(--bg-panel)] border-white/5">
                        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12 xl:col-span-4 h-80 rounded-2xl border border-white/5 bg-amber-500/5 p-6">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                </div>
                <div className="lg:col-span-12 xl:col-span-8 h-80 rounded-2xl border border-white/5 bg-[var(--bg-panel)] p-6">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <Skeleton className="h-56 w-full rounded-xl" />
                </div>
            </div>
            
            <SkeletonTable columns={4} rows={5} />
        </div>
    );
}
