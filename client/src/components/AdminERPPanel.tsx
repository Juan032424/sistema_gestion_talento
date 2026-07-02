import React, { useState } from 'react';
import { Database, FileText, CheckCircle, Save } from 'lucide-react';
import api from '../api';

const AdminERPPanel: React.FC = () => {
    const [tab, setTab] = useState<'RA' | 'RC'>('RA');
    
    // Formularios
    const [raForm, setRaForm] = useState({
        idu_ra: '',
        idu_rp: '',
        candidato_identificacion: '',
        resultado_evaluacion: '',
        experiencia_requerida: '',
        estado_aspirante: 'Pendiente',
    });

    const [rcForm, setRcForm] = useState({
        idu_rc: '',
        idu_ra: '',
        candidato_identificacion: '',
        estado_vinculacion: 'Regular'
    });

    const handleSaveRA = async () => {
        try {
            await api.post('/erp/aspirantes', raForm);
            alert('Aspirante (RA) Guardado en ERP');
        } catch (err) {
            alert('Error guardando en ERP');
        }
    }

    const handleSaveRC = async () => {
        try {
            await api.post('/erp/contratos', rcForm);
            alert('Contrato (RC) Guardado en ERP');
        } catch (err) {
            alert('Error guardando en ERP');
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 my-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 mb-6">
                <Database className="text-blue-600" />
                Panel de Reclutamiento ERP (Columnas Manuales)
            </h2>
            
            <p className="text-sm text-slate-500 mb-6">
                Use este panel para completar los campos de los documentos de Excel que no se llenan automáticamente durante el registro.
            </p>

            <div className="flex gap-4 border-b mb-6">
                <button 
                    onClick={() => setTab('RA')} 
                    className={`pb-2 px-4 font-semibold ${tab === 'RA' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                >
                    Registro Aspirante (RA)
                </button>
                <button 
                    onClick={() => setTab('RC')} 
                    className={`pb-2 px-4 font-semibold ${tab === 'RC' ? 'border-b-2 border-green-600 text-green-600' : 'text-slate-500'}`}
                >
                    Registro Contratación (RC)
                </button>
            </div>

            {tab === 'RA' && (
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="IDU Requisición (Ej. RP01)" value={raForm.idu_rp} onChange={e => setRaForm({...raForm, idu_rp: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="Cédula del Candidato" value={raForm.candidato_identificacion} onChange={e => setRaForm({...raForm, candidato_identificacion: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="IDU Aspirante (Generado, Ej. RA01)" value={raForm.idu_ra} onChange={e => setRaForm({...raForm, idu_ra: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="Resultado Evaluación" value={raForm.resultado_evaluacion} onChange={e => setRaForm({...raForm, resultado_evaluacion: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="Experiencia Requerida" value={raForm.experiencia_requerida} onChange={e => setRaForm({...raForm, experiencia_requerida: e.target.value})} className="border p-2 rounded" />
                    
                    <select value={raForm.estado_aspirante} onChange={e => setRaForm({...raForm, estado_aspirante: e.target.value})} className="border p-2 rounded">
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En Proceso</option>
                        <option value="Seleccionado">Seleccionado</option>
                        <option value="No apto">No Apto</option>
                    </select>

                    <button onClick={handleSaveRA} className="col-span-2 bg-blue-600 text-white font-bold py-2 rounded shadow-md mt-4 hover:bg-blue-700">Guardar Datos de Aspirante</button>
                </div>
            )}

            {tab === 'RC' && (
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="IDU Aspirante Previo (Ej. RA01)" value={rcForm.idu_ra} onChange={e => setRcForm({...rcForm, idu_ra: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="Cédula del Candidato" value={rcForm.candidato_identificacion} onChange={e => setRcForm({...rcForm, candidato_identificacion: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="IDU Contrato (Generado, Ej. RC01)" value={rcForm.idu_rc} onChange={e => setRcForm({...rcForm, idu_rc: e.target.value})} className="border p-2 rounded" />
                    <input type="text" placeholder="Estado Vinculación (Ej: Regular)" value={rcForm.estado_vinculacion} onChange={e => setRcForm({...rcForm, estado_vinculacion: e.target.value})} className="border p-2 rounded" />
                    
                    <button onClick={handleSaveRC} className="col-span-2 bg-green-600 text-white font-bold py-2 rounded shadow-md mt-4 hover:bg-green-700">Generar Contrato y Guardar RC</button>
                </div>
            )}
        </div>
    );
};

export default AdminERPPanel;

