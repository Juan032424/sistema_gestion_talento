import React, { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    Copy,
    Save,
    X
} from 'lucide-react';
import api from '../api';
import type { Empresa, Sede } from '../types';
import { cn } from '../lib/utils';

const EmpresaSedeConfig: React.FC = () => {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [activeTab, setActiveTab] = useState<'empresas' | 'sedes'>('empresas');

    // Modal states
    const [showEmpresaModal, setShowEmpresaModal] = useState(false);
    const [showSedeModal, setShowSedeModal] = useState(false);
    const [currentEmpresa, setCurrentEmpresa] = useState<Partial<Empresa>>({});
    const [currentSede, setCurrentSede] = useState<Partial<Sede>>({});
    const [copyFromId, setCopyFromId] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empresasRes, sedesRes] = await Promise.all([
                api.get('/empresas'),
                api.get('/sedes')
            ]);
            setEmpresas(empresasRes.data);
            setSedes(sedesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSaveEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentEmpresa.id) {
                await api.put(`/empresas/${currentEmpresa.id}`, currentEmpresa);
            } else {
                // If copying characteristics
                let payload = { ...currentEmpresa };
                if (copyFromId) {
                    const source = empresas.find(emp => emp.id === parseInt(copyFromId));
                    if (source) {
                        payload.caracteristicas = source.caracteristicas;
                        payload.sector = source.sector;
                    }
                }
                await api.post('/empresas', payload);
            }
            setShowEmpresaModal(false);
            setCurrentEmpresa({});
            setCopyFromId('');
            fetchData();
        } catch (error) {
            console.error('Error saving empresa:', error);
        }
    };

    const handleSaveSede = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentSede.id) {
                await api.put(`/sedes/${currentSede.id}`, currentSede);
            } else {
                await api.post('/sedes', currentSede);
            }
            setShowSedeModal(false);
            setCurrentSede({});
            fetchData();
        } catch (error) {
            console.error('Error saving sede:', error);
        }
    };

    const handleDeleteEmpresa = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta empresa? Esto podría afectar a las sedes relacionadas.')) return;
        try {
            await api.delete(`/empresas/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting empresa:', error);
        }
    };

    const handleDeleteSede = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta sede?')) return;
        try {
            await api.delete(`/sedes/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting sede:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Configuración de Estructura
                </h1>
                <p className="text-gray-500 text-sm">Gestiona las empresas y sus sedes correspondientes.</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[#161b22] border border-white/5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('empresas')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'empresas' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:text-white"
                    )}
                >
                    <Building2 size={18} />
                    Empresas
                </button>
                <button
                    onClick={() => setActiveTab('sedes')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'sedes' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:text-white"
                    )}
                >
                    <MapPin size={18} />
                    Sedes
                </button>
            </div>

            {activeTab === 'empresas' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Add Card */}
                    <button
                        onClick={() => { setCurrentEmpresa({}); setShowEmpresaModal(true); }}
                        className="group flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-white/5 rounded-3xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all outline-none h-64"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                            <Plus className="text-gray-400 group-hover:text-blue-500" size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">Nueva Empresa</span>
                            <span className="text-xs text-gray-500">Registrar una nueva organización</span>
                        </div>
                    </button>

                    {empresas.map(emp => (
                        <div key={emp.id} className="glass-card p-6 flex flex-col h-64 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Building2 className="text-blue-500" size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setCurrentEmpresa(emp); setShowEmpresaModal(true); }}
                                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmpresa(emp.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{emp.nombre}</h3>
                            <p className="text-sm text-gray-500 mb-4">{emp.sector || 'Sector no especificado'}</p>

                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-mono">{emp.nit || 'Sin NIT'}</span>
                                <div className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                                    {sedes.filter(s => s.empresa_id === emp.id).length} sedes
                                    <ChevronRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Add Sede Card */}
                    <button
                        onClick={() => { setCurrentSede({}); setShowSedeModal(true); }}
                        className="group flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-white/5 rounded-3xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all outline-none h-64"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                            <Plus className="text-gray-400 group-hover:text-indigo-500" size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">Nueva Sede</span>
                            <span className="text-xs text-gray-500">Localización o sucursal operativa</span>
                        </div>
                    </button>

                    {sedes.map(sede => (
                        <div key={sede.id} className="glass-card p-6 flex flex-col h-64 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <MapPin className="text-indigo-500" size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setCurrentSede(sede); setShowSedeModal(true); }}
                                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSede(sede.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{sede.nombre}</h3>
                            <p className="text-sm text-indigo-400 font-medium mb-1">{sede.empresa_nombre}</p>
                            <p className="text-xs text-gray-500 truncate">{sede.direccion || 'Sin dirección'}</p>

                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-gray-500 italic">{sede.contacto || 'Sin contacto'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empresa Modal */}
            {showEmpresaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Building2 className="text-blue-500" />
                                {currentEmpresa.id ? 'Editar Empresa' : 'Nueva Empresa'}
                            </h2>
                            <button onClick={() => setShowEmpresaModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmpresa} className="p-8 space-y-6">
                            {!currentEmpresa.id && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                                        Relacionar con Características de:
                                    </label>
                                    <select
                                        value={copyFromId}
                                        onChange={(e) => setCopyFromId(e.target.value)}
                                        className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all text-white appearance-none"
                                    >
                                        <option value="">Ninguna (Empezar de cero)</option>
                                        {empresas.map(e => (
                                            <option key={e.id} value={e.id}>{e.nombre}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 italic pl-1 flex items-center gap-1">
                                        <Copy size={10} /> Copiará sector y campos personalizados.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    required
                                    value={currentEmpresa.nombre || ''}
                                    onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, nombre: e.target.value })}
                                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all text-white"
                                    placeholder="Ej: DISCOL SAS"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">NIT / ID</label>
                                    <input
                                        type="text"
                                        value={currentEmpresa.nit || ''}
                                        onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, nit: e.target.value })}
                                        className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all text-white"
                                        placeholder="NIT Comercial"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Sector</label>
                                    <input
                                        type="text"
                                        value={currentEmpresa.sector || ''}
                                        onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, sector: e.target.value })}
                                        className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all text-white"
                                        placeholder="Ej: Industrial, IT"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEmpresaModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {currentEmpresa.id ? 'Actualizar' : 'Crear Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sede Modal */}
            {showSedeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <MapPin className="text-indigo-500" />
                                {currentSede.id ? 'Editar Sede' : 'Nueva Sede'}
                            </h2>
                            <button onClick={() => setShowSedeModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSede} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Empresa Perteneciente</label>
                                <select
                                    required
                                    value={currentSede.empresa_id || ''}
                                    onChange={(e) => setCurrentSede({ ...currentSede, empresa_id: parseInt(e.target.value) })}
                                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all text-white appearance-none"
                                >
                                    <option value="">Seleccionar Empresa...</option>
                                    {empresas.map(e => (
                                        <option key={e.id} value={e.id}>{e.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nombre de la Sede</label>
                                <input
                                    type="text"
                                    required
                                    value={currentSede.nombre || ''}
                                    onChange={(e) => setCurrentSede({ ...currentSede, nombre: e.target.value })}
                                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all text-white"
                                    placeholder="Ej: Sede Principal Bogota"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Dirección</label>
                                <input
                                    type="text"
                                    value={currentSede.direccion || ''}
                                    onChange={(e) => setCurrentSede({ ...currentSede, direccion: e.target.value })}
                                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all text-white"
                                    placeholder="Calle, Ciudad, Pais"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Contacto / Teléfono</label>
                                <input
                                    type="text"
                                    value={currentSede.contacto || ''}
                                    onChange={(e) => setCurrentSede({ ...currentSede, contacto: e.target.value })}
                                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all text-white"
                                    placeholder="+57..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSedeModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {currentSede.id ? 'Actualizar' : 'Crear Sede'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmpresaSedeConfig;
