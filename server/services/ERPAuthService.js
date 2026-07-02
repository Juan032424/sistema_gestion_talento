/**
 * ERP Authentication Service
 * Integra verificación de candidatos en el ERP al momento del registro
 */

const db = require('../db');

class ERPAuthService {
    
    /**
     * Verifica si un candidato existe en el ERP por cédula
     * Si existe, retorna sus datos para vinculación automática
     */
    async verificarCedulaEnERP(cedula) {
        try {
            const sql = `
                SELECT 
                    id, identificacion, primer_nombre, segundo_nombre,
                    primer_apellido, segundo_apellido, email, telefono,
                    fecha_nacimiento, genero, nivel_academico,
                    municipio_ciudad, direccion, hoja_vida_pdf
                FROM erp_candidatos
                WHERE identificacion = ?
                LIMIT 1
            `;
            
            const [results] = await db.query(sql, [cedula]);
            
            if (results.length > 0) {
                return {
                    encontrado: true,
                    candidato_erp: results[0],
                    mensaje: 'Candidato encontrado en base de datos ERP'
                };
            }
            
            return {
                encontrado: false,
                candidato_erp: null,
                mensaje: 'Candidato no encontrado en base de datos ERP'
            };
            
        } catch (error) {
            console.error('[ERPAuthService] Error verificando cédula:', error);
            throw new Error('Error al verificar candidato en ERP');
        }
    }
    
    /**
     * Registra un nuevo candidato en el sistema vinculándolo al ERP si existe
     * Si existe en ERP, copia seus datos; si no, crea uno nuevo
     */
    async registrarCandidatoConERP(candidateData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const { email, password_hash, cedula, nombre, apellido } = candidateData;
            
            // 1. Verificar si existe en ERP
            const verificacion = await this.verificarCedulaEnERP(cedula);
            
            // 2. Crear cuenta en sistema
            const candidateAccountData = {
                email,
                password_hash,
                nombre: verificacion.encontrado ? verificacion.candidato_erp.primer_nombre : nombre,
                apellido: verificacion.encontrado ? verificacion.candidato_erp.primer_apellido : apellido,
                telefono: verificacion.encontrado ? verificacion.candidato_erp.telefono : candidateData.telefono,
                ciudad: verificacion.encontrado ? verificacion.candidato_erp.municipio_ciudad : candidateData.ciudad,
                genero: verificacion.encontrado ? verificacion.candidato_erp.genero : candidateData.genero,
                fecha_nacimiento: verificacion.encontrado ? verificacion.candidato_erp.fecha_nacimiento : candidateData.fecha_nacimiento
            };
            
            // Filtrar null/undefined
            Object.keys(candidateAccountData).forEach(key => 
                candidateAccountData[key] === null && delete candidateAccountData[key]
            );
            
            const candidateAccountSql = `
                INSERT INTO candidate_accounts (${Object.keys(candidateAccountData).join(', ')})
                VALUES (${Object.keys(candidateAccountData).map(() => '?').join(', ')})
            `;
            
            const [insertResult] = await connection.execute(
                candidateAccountSql,
                Object.values(candidateAccountData)
            );
            
            const candidate_account_id = insertResult.insertId;
            
            // 3. Si existe en ERP, hacer vinculación
            if (verificacion.encontrado) {
                const vinculacionSql = `
                    INSERT INTO erp_vinculaciones (
                        candidate_account_id, candidato_erp_id, vinculacion_type, activa
                    ) VALUES (?, ?, 'Automática', 1)
                `;
                
                await connection.execute(vinculacionSql, [
                    candidate_account_id,
                    verificacion.candidato_erp.id
                ]);
            }
            
            await connection.commit();
            
            return {
                exito: true,
                candidate_account_id,
                vinculado_erp: verificacion.encontrado,
                datos_erp: verificacion.encontrado ? verificacion.candidato_erp : null,
                mensaje: verificacion.encontrado 
                    ? 'Registro completado. Datos vinculados con ERP exitosamente.'
                    : 'Registro completado. Nuevo candidato creado.'
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('[ERPAuthService] Error en registro:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * Obtiene el historial completo de un candidato (requisiiciones, aspiraciones, contrataciones)
     */
    async obtenerHistorialCompleto(cedula) {
        try {
            // Obtener candidato ERP
            const sqlCandidato = `
                SELECT * FROM erp_candidatos
                WHERE identificacion = ?
            `;
            const [candidatos] = await db.query(sqlCandidato, [cedula]);
            
            if (candidatos.length === 0) {
                return {
                    candidato: null,
                    requisiciones: [],
                    aspiraciones: [],
                    contrataciones: []
                };
            }
            
            const candidato = candidatos[0];
            const candidato_erp_id = candidato.id;
            
            // Obtener aspiraciones
            const sqlAspiraciones = `
                SELECT a.*, r.puesto_solicitado, r.area_proyecto, r.estatus_aprobacion
                FROM erp_aspirantes a
                LEFT JOIN erp_requisiciones r ON a.idu_requisicion = r.idu_requisicion
                WHERE a.numero_cedula = ? OR a.candidato_erp_id = ?
                ORDER BY a.fecha_solicitud DESC
            `;
            const [aspiraciones] = await db.query(sqlAspiraciones, [cedula, candidato_erp_id]);
            
            // Obtener contrataciones
            const sqlContrataciones = `
                SELECT * FROM erp_contrataciones
                WHERE numero_cedula = ?
                ORDER BY fecha_creacion DESC
            `;
            const [contrataciones] = await db.query(sqlContrataciones, [cedula]);
            
            // Obtener requisiciones (solo las que aplican)
            const requisicionesIds = aspiraciones.map(a => a.idu_requisicion).filter(Boolean);
            let requisiciones = [];
            
            if (requisicionesIds.length > 0) {
                const placeholders = requisicionesIds.map(() => '?').join(',');
                const sqlRequisiciones = `
                    SELECT * FROM erp_requisiciones
                    WHERE idu_requisicion IN (${placeholders})
                    AND estatus_aprobacion = 'Aprobado'
                `;
                [requisiciones] = await db.query(sqlRequisiciones, requisicionesIds);
            }
            
            return {
                candidato,
                requisiciones,
                aspiraciones,
                contrataciones
            };
            
        } catch (error) {
            console.error('[ERPAuthService] Error obteniendo historial:', error);
            throw error;
        }
    }
    
    /**
     * Obtiene el estado actual del proceso para un candidato (stepper/timeline)
     */
    async obtenerEstadoProceso(cedula) {
        try {
            const historial = await this.obtenerHistorialCompleto(cedula);
            
            if (!historial.candidato) {
                return { error: 'Candidato no encontrado' };
            }
            
            const aplicaciones = [];
            
            // Agrupar por requisición
            const reqMap = new Map();
            
            for (const aspiracion of historial.aspiraciones) {
                const iduReq = aspiracion.idu_requisicion;
                
                if (!reqMap.has(iduReq)) {
                    const req = historial.requisiciones.find(r => r.idu_requisicion === iduReq);
                    reqMap.set(iduReq, {
                        idu_requisicion: iduReq,
                        puesto: aspiracion.puesto_solicitado,
                        area: aspiracion.area_proyecto,
                        estatus_requisicion: aspiracion.estatus_aprobacion,
                        aspiraciones: []
                    });
                }
                
                reqMap.get(iduReq).aspiraciones.push(aspiracion);
            }
            
            // Construir resposta final
            for (const [, reqData] of reqMap) {
                const ultimaAspiracion = reqData.aspiraciones[0];
                
                // Buscar contrato
                const contrato = historial.contrataciones.find(c => 
                    c.idu_aspirante === ultimaAspiracion.idu_aspirante
                );
                
                let estadoActual = 1;  // Default: requisición
                let progreso = 25;
                let progressoTexto = 'Requisición en proceso';
                
                if (reqData.estatus_requisicion !== 'Aprobado') {
                    estadoActual = 0;
                    progreso = 10;
                    progressoTexto = 'Requisición no aprobada';
                } else if (ultimaAspiracion) {
                    progreso = 50;
                    progressoTexto = 'Candidatura registrada';
                    estadoActual = 2;
                    
                    if (ultimaAspiracion.decision_seleccion === 'Seleccionado') {
                        progreso = 75;
                        progressoTexto = 'Seleccionado para entrevista';
                        estadoActual = 3;
                    }
                    
                    if (contrato) {
                        progreso = 100;
                        progressoTexto = 'Contratado';
                        estadoActual = 4;
                    }
                }
                
                aplicaciones.push({
                    idu_requisicion: reqData.idu_requisicion,
                    puesto: reqData.puesto,
                    area: reqData.area,
                    idu_aspirante: ultimaAspiracion?.idu_aspirante,
                    decision: ultimaAspiracion?.decision_seleccion || 'Pendiente',
                    puntaje: ultimaAspiracion?.resultado_evaluacion || 0,
                    idu_contrato: contrato?.idu_contrato,
                    estado_vinculacion: contrato?.estado_vinculacion,
                    
                    estadoActual,
                    progreso,
                    progressoTexto,
                    
                    docs_pendientes: this._obtenerDocsPendientes(contrato),
                    fecha_aspiracion: ultimaAspiracion?.fecha_solicitud,
                    fecha_contrato: contrato?.fecha_creacion
                });
            }
            
            return {
                candidato: {
                    cedula: historial.candidato.identificacion,
                    nombre: `${historial.candidato.primer_nombre} ${historial.candidato.primer_apellido}`,
                    email: historial.candidato.email,
                    telefono: historial.candidato.telefono
                },
                aplicaciones,
                total_solicitudes: historial.aspiraciones.length,
                total_contrataciones: historial.contrataciones.length
            };
            
        } catch (error) {
            console.error('[ERPAuthService] Error en estado proceso:', error);
            throw error;
        }
    }
    
    /**
     * Helper: obtiene documentos pendientes de una contratación
     */
    _obtenerDocsPendientes(contrato) {
        if (!contrato) return null;
        
        const docs = [];
        if (contrato.examenes_medicos_estado === 'Pendiente') docs.push('EMO (Examen Médico)');
        if (contrato.cedula_estado === 'Pendiente') docs.push('Cédula');
        if (contrato.hoja_vida_estado === 'Pendiente') docs.push('Hoja de Vida');
        if (contrato.policia_estado === 'Pendiente') docs.push('Antecedentes Policivos');
        if (contrato.sarlaft_estado === 'Pendiente') docs.push('SARLAFT');
        if (contrato.aptitud_estado === 'Pendiente') docs.push('Aptitud Laboral');
        
        return docs.length > 0 ? docs : null;
    }
    
    /**
     * Descarga documentos de vinculación (para generación de links)
     */
    async obtenerLinksDescargaDocumentos(idu_contrato) {
        try {
            const sql = `
                SELECT 
                    idu_contrato,
                    examenes_medicos_pdf,
                    cedula_pdf,
                    hoja_vida_pdf,
                    policia_antecedentes_pdf,
                    certificacion_bancaria_pdf,
                    licencia_conducir_pdf,
                    medidas_correctivas_pdf,
                    sarlaft_pdf,
                    aptitud_laboral_pdf
                FROM erp_contrataciones
                WHERE idu_contrato = ?
            `;
            
            const [results] = await db.query(sql, [idu_contrato]);
            
            if (results.length === 0) {
                return { error: 'Contrato no encontrado' };
            }
            
            const contrato = results[0];
            const documentos = {};
            
            for (const [key, value] of Object.entries(contrato)) {
                if (key !== 'idu_contrato' && value) {
                    documentos[key.replace('_pdf', '')] = value;
                }
            }
            
            return {
                idu_contrato,
                documentos
            };
            
        } catch (error) {
            console.error('[ERPAuthService] Error obteniendo links:', error);
            throw error;
        }
    }
}

module.exports = new ERPAuthService();
