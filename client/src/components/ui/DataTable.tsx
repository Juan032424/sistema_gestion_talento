import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ColumnDef<T> {
    header: string;
    accessorKey?: keyof T | string;
    id?: string;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string; // Optional custom column class
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    pagination?: boolean;
    pageSize?: number;
    className?: string;
    emptyMessage?: string;
    rowClassName?: (item: T) => string;
}

export function DataTable<T>({
    data,
    columns,
    searchable = true,
    searchPlaceholder = "Buscar...",
    onRowClick,
    pagination = true,
    pageSize = 10,
    className,
    emptyMessage = "No hay datos disponibles.",
    rowClassName
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerSearch = searchTerm.toLowerCase();
        return data.filter(item => {
            return Object.values(item as any).some(val => 
                String(val).toLowerCase().includes(lowerSearch)
            );
        });
    }, [data, searchTerm]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        return [...filteredData].sort((a: any, b: any) => {
            const aValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a);
            const bValue = sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b);

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
            if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc' 
                    ? aValue.localeCompare(bValue) 
                    : bValue.localeCompare(aValue);
            }
            
            return sortConfig.direction === 'asc' 
                ? (aValue < bValue ? -1 : 1) 
                : (aValue > bValue ? -1 : 1);
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, pagination, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className={cn("flex flex-col space-y-4", className)}>
            {/* Toolbar: Search */}
            {searchable && (
                <div className="flex items-center justify-between">
                    <div className="relative w-full max-w-sm group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-500 group-focus-within:text-[#3a94cc] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset page on search
                            }}
                            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-[#161b22]/50 text-white placeholder-gray-500 focus:outline-none focus:border-[#3a94cc]/50 focus:ring-1 focus:ring-[#3a94cc]/50 transition-all sm:text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0d1117] border-b border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                {columns.map((col, index) => {
                                    const sortKey = (col.accessorKey as string) || col.id;
                                    const isSorted = sortConfig?.key === sortKey;
                                    return (
                                        <th 
                                            key={index} 
                                            className={cn(
                                                "p-4 whitespace-nowrap select-none", 
                                                col.sortable && "cursor-pointer hover:text-white transition-colors group",
                                                col.className
                                            )}
                                            onClick={() => col.sortable && sortKey && handleSort(sortKey)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.header}
                                                {col.sortable && sortKey && (
                                                    <div className="flex flex-col text-gray-600 group-hover:text-gray-400">
                                                        <ChevronUp size={10} className={cn("-mb-1", isSorted && sortConfig.direction === 'asc' ? "text-[#3a94cc]" : "")} />
                                                        <ChevronDown size={10} className={cn(isSorted && sortConfig.direction === 'desc' ? "text-[#3a94cc]" : "")} />
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, rowIndex) => (
                                    <tr 
                                        key={rowIndex} 
                                        onClick={() => onRowClick && onRowClick(item)}
                                        className={cn(
                                            "hover:bg-white/[0.04] transition-colors group",
                                            onRowClick && "cursor-pointer",
                                            rowClassName ? rowClassName(item) : ""
                                        )}
                                    >
                                        {columns.map((col, colIndex) => {
                                            let cellContent: React.ReactNode;
                                            if (col.cell) {
                                                cellContent = col.cell(item);
                                            } else if (col.accessorKey) {
                                                const value = (col.accessorKey as string).split('.').reduce((obj: any, key) => obj?.[key], item);
                                                cellContent = value as React.ReactNode;
                                            }
                                            return (
                                                <td key={colIndex} className={cn("p-4", col.className)}>
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="p-12 text-center text-gray-500 italic text-sm">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination && totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-white/10 bg-[#0d1117]/50 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-gray-400">
                                    Mostrando <span className="font-medium text-white">{((currentPage - 1) * pageSize) + 1}</span> a <span className="font-medium text-white">{Math.min(currentPage * pageSize, sortedData.length)}</span> de <span className="font-medium text-white">{sortedData.length}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-transparent text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    {/* Simple page numbers */}
                                    <div className="hidden md:flex">
                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const page = idx + 1;
                                            // Show first, last, current, and adjacent pages
                                            if (
                                                page === 1 || 
                                                page === totalPages || 
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={cn(
                                                            "relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium transition-colors",
                                                            currentPage === page 
                                                                ? "z-10 bg-[#3a94cc]/20 border-[#3a94cc]/50 text-[#3a94cc]" 
                                                                : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === currentPage - 2 || 
                                                page === currentPage + 2
                                            ) {
                                                return (
                                                    <span key={page} className="relative inline-flex items-center px-4 py-2 border border-white/10 bg-transparent text-sm font-medium text-gray-500">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-transparent text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
