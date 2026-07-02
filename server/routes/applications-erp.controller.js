/**
 * ERP Applications Controller  
 * GET /my-applications - Obtiene aplicaciones del candidato con info de ERP
 * GET /my-applications/:id - Detalle de una aplicación
 * GET /my-applications/:id/documents - URLs de documentos de vinculación
 */

const ERPAuthService = require('../services/ERPAuthService');
const db = require('../db');

// =====================================================
// GET /my-applications
// =====================================================
exports.getMyApplications = async (req, res) => {
    try {
        const candidateId = req.user.candidate_account_id || req.user.id;
        
        // Obtener email del candidato
        const sqlCandidate = `
            SELECT id, email FROM candidate_accounts WHERE id = ?
        `;
        const [candidates] = await db.query(sqlCandidate, [candidateId]);
        
        if (!candidates.length) {
            return res.status(404).json({ 
                error: 'Candidato no encontrado en sistema' 
            });
        }
        
        const candidateEmail = candidates[0].email;
        
        // Buscar cédula asociada al candidato
        let cedula = null;
        
        // Opción 1: Buscar directamente en vinculaciones
        const sqlVinc = `
            SELECT c.identificacion
            FROM erp_vinculaciones v
            JOIN erp_candidatos c ON v.candidato_erp_id = c.id
            WHERE v.candidate_account_id = ? AND v.activa = 1
            LIMIT 1
        `;
        const [vincResults] = await db.query(sqlVinc, [candidateId]);
        
        if (vincResults.length > 0) {
            cedula = vincResults[0].identificacion;
        } else {
            // Opción 2: Buscar que coincida email
            const sqlByEmail = `
                SELECT identificacion FROM erp_candidatos
                WHERE email = ?
                LIMIT 1
            `;
            const [emailResults] = await db.query(sqlByEmail, [candidateEmail]);
            
            if (emailResults.length > 0) {
                cedula = emailResults[0].identificacion;
            }
        }
        
        // Si no hay cédula, retornar aplicaciones del sistema
        if (!cedula) {
            return exports.getMyApplicationsLegacy(req, res);
        }
        
        // Obtener estado del proceso desde ERP
        const procesoBusiness = await ERPAuthService.obtenerEstadoProceso(cedula);
        
        // Enriquecer con aplicaciones del sistema
        const sqlApplications = `
            SELECT a.*, v.codigo_requisicion, v.puesto_nombre
            FROM applications a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            WHERE a.candidato_id = ?
            ORDER BY a.fecha_postulacion DESC
        `;
        const [systemApplications] = await db.query(sqlApplications, [candidateId]);
        
        // Combinar datos de sistema + ERP
        const aplicacionesConsolidadas = [];
        
        if (procesoBusiness.aplicaciones) {
            for (const app of procesoBusiness.aplicaciones) {
                const systemApp = systemApplications.find(sa => 
                    sa.codigo_requisicion === app.idu_requisicion
                );
                
                aplicacionesConsolidadas.push({
                    // Datos del sistema
                    ...systemApp,
                    
                    // Datos del ERP
                    idu_requisicion: app.idu_requisicion,
                    idu_aspirante: app.idu_aspirante,
                    idu_contrato: app.idu_contrato,
                    puesto_solicitado: app.puesto,
                    area_proyecto: app.area,
                    
                    // Estado del proceso
                    decision: app.decision,
                    puntaje_evaluacion: app.puntaje,
                    estado_vinculacion: app.estado_vinculacion,
                    
                    // Timeline
                    paso_actual: app.estadoActual,      // 0-4 step
                    progreso_porcentaje: app.progreso,  // 0-100
                    estado_texto: app.progressoTexto,
                    
                    // Documentación
                    documentos_pendientes: app.docs_pendientes,
                    puede_descargar_docs: app.idu_contrato ? true : false,
                    
                    // Fechas
                    fecha_aspiracion: app.fecha_aspiracion,
                    fecha_contrato: app.fecha_contrato,
                    
                    // Referencias para obtener detalles
                    system_app_id: systemApp?.id,
                    erp_integrated: true
                });
            }
        }
        
        // Si no hay aplicaciones en ERP pero hay en sistema, incluir esas
        if (aplicacionesConsolidadas.length === 0 && systemApplications.length > 0) {
            aplicacionesConsolidadas.push(...systemApplications.map(app => ({
                ...app,
                paso_actual: 1,
                progreso_porcentaje: 25,
                estado_texto: 'Aplicación en revisión',
                documentos_pendientes: null,
                erp_integrated: false
            })));
        }
        
        return res.status(200).json({
            exito: true,
            candidato: procesoBusiness.candidato,
            total_aplicaciones: aplicacionesConsolidadas.length,
            total_contrataciones: procesoBusiness.total_contrataciones,
            aplicaciones: aplicacionesConsolidadas,
            mensaje: 'Aplicaciones obtenidas exitosamente'
        });
        
    } catch (error) {
        console.error('[ApplicationsController] Error en getMyApplications:', error);
        res.status(500).json({
            error: 'Error obteniendo tus aplicaciones',
            detalle: error.message
        });
    }
};

// =====================================================
// GET /my-applications/:id (Detalle)
// =====================================================
exports.getApplicationDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const candidateId = req.user.candidate_account_id || req.user.id;
        
        // Buscar por ID del sistema o IDU de ERP
        let sql, params;
        
        if (id.startsWith('RA')) {
            // Buscar por IDU de aspirante en ERP
            sql = `
                SELECT a.*, r.*, c.numero_cedula
                FROM erp_aspirantes a
                LEFT JOIN erp_requisiciones r ON a.idu_requisicion = r.idu_requisicion
                LEFT JOIN erp_contrataciones c ON a.id = c.aspirante_erp_id
                WHERE a.idu_aspirante = ?
            `;
            params = [id];
        } else {
            // Buscar por ID del sistema
            sql = `
                SELECT a.*, v.codigo_requisicion, v.puesto_nombre, v.salario_base_ofrecido
                FROM applications a
                LEFT JOIN vacantes v ON a.vacante_id = v.id
                WHERE a.id = ? AND a.candidato_id = ?
            `;
            params = [id, candidateId];
        }
        
        const [results] = await db.query(sql, params);
        
        if (!results.length) {
            return res.status(404).json({
                error: 'Aplicación no encontrada'
            });
        }
        
        const app = results[0];
        
        res.status(200).json({
            exito: true,
            aplicacion: app
        });
        
    } catch (error) {
        console.error('[ApplicationsController] Error en getApplicationDetail:', error);
        res.status(500).json({
            error: 'Error obteniendo detalle de aplicación'
        });
    }
};

// =====================================================
// GET /my-applications/:id/documents
// Descarga links de documentos de vinculación
// =====================================================
exports.getApplicationDocuments = async (req, res) => {
    try {
        const { id } = req.params;  // IDU de contrato (RC0001, etc.)
        const candidateId = req.user.candidate_account_id || req.user.id;
        
        // Validar que es un RC (contrato)
        if (!id.startsWith('RC')) {
            return res.status(400).json({
                error: 'ID debe ser un contrato (RC...)'
            });
        }
        
        // Verificar que el contrato pertenece a este candidato
        const sqlVerify = `
            SELECT cont.*, asp.numero_cedula
            FROM erp_contrataciones cont
            LEFT JOIN erp_aspirantes asp ON cont.idu_aspirante = asp.idu_aspirante
            WHERE cont.idu_contrato = ?
        `;
        const [verify] = await db.query(sqlVerify, [id]);
        
        if (!verify.length) {
            return res.status(404).json({
                error: 'Contrato no encontrado'
            });
        }
        
        const contrato = verify[0];
        
        // Obtener docs mediante service
        const docs = await ERPAuthService.obtenerLinksDescargaDocumentos(id);
        
        res.status(200).json({
            exito: true,
            idu_contrato: id,
            estado_vinculacion: contrato.estado_vinculacion,
            documentos: docs.documentos || {},
            mensaje: 'Links de documentos listo para descargar'
        });
        
    } catch (error) {
        console.error('[ApplicationsController] Error en getApplicationDocuments:', error);
        res.status(500).json({
            error: 'Error obteniendo documentos'
        });
    }
};

// =====================================================
// Legacy: Obtener aplicaciones del sistema (sin ERP)
// =====================================================
exports.getMyApplicationsLegacy = async (req, res) => {
    try {
        const candidateId = req.user.candidate_account_id || req.user.id;
        
        const sql = `
            SELECT 
                a.*,
                v.codigo_requisicion,
                v.puesto_nombre,
                v.estado,
                p.nombre as proceso_nombre,
                s.nombre as sede_nombre
            FROM applications a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            LEFT JOIN procesos p ON v.proceso_id = p.id
            LEFT JOIN sedes s ON v.sede_id = s.id
            WHERE a.candidato_id = ?
            ORDER BY a.fecha_postulacion DESC
        `;
        
        const [applications] = await db.query(sql, [candidateId]);
        
        res.status(200).json({
            exito: true,
            aplicaciones: applications,
            total: applications.length,
            fuente: 'Sistema Local',
            mensaje: 'Datos del sistema (no integrado con ERP)'
        });
        
    } catch (error) {
        console.error('[ApplicationsController] Error legacy:', error);
        res.status(500).json({
            error: 'Error obteniendo aplicaciones'
        });
    }
};

// =====================================================
// POST /my-applications/:id/update-status
// Actualizar estado de aplicación
// =====================================================
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoEstado, notas } = req.body;
        const candidateId = req.user.candidate_account_id || req.user.id;
        
        // Validar estado
        const estadosValidos = ['Nueva', 'En Revisión', 'Preseleccionado', 'Entrevista', 'Oferta', 'Contratado', 'Rechazado'];
        
        if (!estadosValidos.includes(nuevoEstado)) {
            return res.status(400).json({
                error: `Estado inválido. Valores válidos: ${estadosValidos.join(', ')}`
            });
        }
        
        const sql = `
            UPDATE applications
            SET estado = ?, notas_reclutador = ?
            WHERE id = ? AND candidato_id = ?
        `;
        
        const [result] = await db.query(sql, [nuevoEstado, notas || null, id, candidateId]);
        
        if (result.affectedRows === 0) {
            return res.status(403).json({
                error: 'No se pudo actualizar. Aplicación no encontrada o no autorizado.'
            });
        }
        
        res.status(200).json({
            exito: true,
            mensaje: 'Estado actualizado correctamente'
        });
        
    } catch (error) {
        console.error('[ApplicationsController] Error en updateApplicationStatus:', error);
        res.status(500).json({
            error: 'Error actualizando estado'
        });
    }
};
