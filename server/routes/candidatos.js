const express = require('express');
const router = express.Router();
const pool = require('../db');
const activityLogService = require('../services/ActivityLogService');
const aiService = require('../services/aiService');
const auditService = require('../services/AuditService');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const emailService = require('../services/EmailService');

const allowedRoles = ['Superadmin', 'Admin', 'Reclutador', 'Lider'];

// GET all candidatos with vacante info
router.get('/', verifyToken, requireRole(allowedRoles), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, v.puesto_nombre, v.codigo_requisicion, v.fecha_apertura
            FROM candidatos_seguimiento c
            JOIN vacantes v ON c.vacante_id = v.id
            WHERE c.deleted_at IS NULL
            ORDER BY c.id DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET bottleneck analysis
router.get('/analytics/bottlenecks', verifyToken, requireRole(allowedRoles), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                etapa_nombre,
                AVG(TIMESTAMPDIFF(HOUR, fecha_inicio, COALESCE(fecha_fin, CURRENT_TIMESTAMP))) / 24 as avg_days_in_stage
            FROM historial_etapas
            GROUP BY etapa_nombre
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET candidatos for a specific vacante
router.get('/vacante/:vacanteId', verifyToken, requireRole(allowedRoles), async (req, res) => {
    const { vacanteId } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM candidatos_seguimiento WHERE vacante_id = ? AND deleted_at IS NULL', [vacanteId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single candidato (Generic ID must be LAST)
router.get('/:id', verifyToken, requireRole(allowedRoles), async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get tracking record
        const [rows] = await pool.query('SELECT * FROM candidatos_seguimiento WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Candidato no encontrado' });
        
        const candidato = rows[0];
        
        // 2. Enrich with portal data if cedula exists
        if (candidato.cedula) {
            try {
                const [portalRows] = await pool.query('SELECT * FROM candidatos WHERE cedula = ?', [candidato.cedula]);
                if (portalRows.length > 0) {
                    const p = portalRows[0];
                    // Merge portal data into tracking record (tracking data takes priority for shared fields)
                    candidato.tipo_identificacion = p.tipo_identificacion || null;
                    candidato.segundo_nombre = p.segundo_nombre || null;
                    candidato.segundo_apellido = p.segundo_apellido || null;
                    candidato.primer_apellido = p.primer_apellido || null;
                    candidato.lugar_expedicion = p.lugar_expedicion || null;
                    candidato.fecha_expedicion = p.fecha_expedicion || null;
                    candidato.direccion = p.direccion || null;
                    candidato.fecha_nacimiento = p.fecha_nacimiento || null;
                    candidato.grupo_etnico = p.grupo_etnico || null;
                    candidato.genero = p.genero || null;
                    candidato.estado_civil = p.estado_civil || null;
                    candidato.tiene_familiar = p.tiene_familiar || null;
                    candidato.parentesco_familiar = p.parentesco_familiar || null;
                    candidato.nombre_familiar = p.nombre_familiar || null;
                    candidato.telefono_familiar = p.telefono_familiar || null;
                    candidato.tipo_vivienda = p.tipo_vivienda || null;
                    candidato.servicios_publicos = p.servicios_publicos || null;
                    candidato.estrato = p.estrato || null;
                    candidato.tipo_vehiculo = p.tipo_vehiculo || null;
                    candidato.vehiculo_placa = p.vehiculo_placa || null;
                    candidato.vehiculo_marca_modelo = p.vehiculo_marca_modelo || null;
                    candidato.vehiculo_modelo_ano = p.vehiculo_modelo_ano || null;
                    candidato.vehiculo_nombre_propietario = p.vehiculo_nombre_propietario || null;
                    candidato.vehiculo_cedula_propietario = p.vehiculo_cedula_propietario || null;
                    candidato.tiene_tarjeta_profesional = p.tiene_tarjeta_profesional || null;
                    candidato.numero_tarjeta_profesional = p.numero_tarjeta_profesional || null;
                    candidato.formacion_academica = p.formacion_academica || null;
                    candidato.historial_laboral = p.historial_laboral || null;
                    candidato.tiene_hijos = p.tiene_hijos || null;
                    candidato.cantidad_hijos = p.cantidad_hijos || 0;
                    candidato.cabeza_familia = p.cabeza_familia || null;
                    candidato.discapacidad = p.discapacidad || null;
                    candidato.dispuesto_celular = p.dispuesto_celular || null;
                    candidato.casco_integral = p.casco_integral || null;
                    candidato.ano_matricula_moto = p.ano_matricula_moto || null;
                    // Use portal email/phone/cv if tracking doesn't have them
                    candidato.email = candidato.email || p.email || null;
                    candidato.telefono = candidato.telefono || p.telefono || null;
                    candidato.nivel_educativo = p.titulo_profesional || null;
                    candidato.experiencia_total_anos = p.experiencia_total_anos || 0;
                    candidato.ciudad = p.ciudad || null;
                    // Use portal CV if tracking CV is empty
                    if (!candidato.cv_url && p.cv_url) {
                        candidato.cv_url = p.cv_url;
                    }
                }
            } catch (portalErr) {
                console.log('Portal data enrichment skipped:', portalErr.message);
            }
        }
        
        res.json(candidato);
    } catch (error) {
        console.error('Error GET /candidatos/:id', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST Create Candidato
router.post('/', verifyToken, requireRole(['Superadmin', 'Admin', 'Reclutador']), async (req, res) => {
    const {
        vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento,
        salario_pretendido, fecha_entrevista, estado_entrevista,
        resultado_candidato, motivo_no_apto, estatus_90_dias,
        calificacion_tecnica, resultado_final
    } = req.body;

    try {
        console.log('Registering Candidate:', req.body);

        const [result] = await pool.query(`
            INSERT INTO candidatos_seguimiento 
            (vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento, salario_pretendido, fecha_entrevista, estado_entrevista, resultado_candidato, motivo_no_apto, estatus_90_dias, cv_url, fecha_postulacion, calificacion_tecnica, resultado_final)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            vacante_id,
            nombre_candidato,
            etapa_actual || 'Postulación',
            fuente_reclutamiento || 'LinkedIn',
            salario_pretendido || 0,
            fecha_entrevista || null,
            estado_entrevista || 'Pendiente',
            resultado_candidato || null,
            motivo_no_apto || null,
            estatus_90_dias || null,
            req.body.cv_url || null,
            req.body.fecha_postulacion || new Date().toISOString().split('T')[0], // Use today if no date provided
            calificacion_tecnica || 0,
            resultado_final || null
        ]);

        // Record initial stage
        await pool.query(`
            INSERT INTO historial_etapas (vacante_id, candidato_id, etapa_nombre)
            VALUES (?, ?, ?)
        `, [vacante_id, result.insertId, etapa_actual || 'Postulación']);

        await auditService.log(
            req.user?.id || null,
            req.user?.email || null,
            'candidatos_seguimiento',
            result.insertId,
            'CREATE',
            { vacante_id, nombre_candidato, etapa_actual: etapa_actual || 'Postulación' },
            req.ip
        );

        res.json({ id: result.insertId, message: 'Candidato registrado exitosamente' });
    } catch (error) {
        console.error('Error in POST /candidatos:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', verifyToken, requireRole(['Superadmin', 'Admin', 'Reclutador']), async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    console.log(`\n--- NASA UPDATE START [ID: ${id}] ---`);
    console.log('NASA Payload:', JSON.stringify(updates));

    try {
        // 1. Stage History Logic (Isolated)
        if (updates.etapa_actual) {
            try {
                const [rows] = await pool.query('SELECT etapa_actual, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);
                const currentRecord = rows[0];

                if (currentRecord && currentRecord.etapa_actual !== updates.etapa_actual) {
                    console.log(`NASA Historial: Stage change ${currentRecord.etapa_actual} -> ${updates.etapa_actual}`);

                    // Close open stages
                    await pool.query(
                        'UPDATE historial_etapas SET fecha_fin = CURRENT_TIMESTAMP WHERE candidato_id = ? AND fecha_fin IS NULL',
                        [id]
                    );

                    // Open new stage
                    await pool.query(
                        'INSERT INTO historial_etapas (vacante_id, candidato_id, etapa_nombre) VALUES (?, ?, ?)',
                        [currentRecord.vacante_id, id, updates.etapa_actual]
                    );
                    console.log('NASA Historial: Table updated successfully.');

                    // 📧 AUTOMATED CANDIDATE NOTIFICATION (MAGIC LINK)
                    try {
                        const [cDataRows] = await pool.query(`
                            SELECT cs.nombre_candidato, cs.vacante_id, a.email, a.id as application_id, v.puesto_nombre
                            FROM candidatos_seguimiento cs
                            JOIN vacantes v ON cs.vacante_id = v.id
                            LEFT JOIN applications a ON cs.nombre_candidato = a.nombre AND cs.vacante_id = a.vacante_id
                            WHERE cs.id = ?
                            LIMIT 1
                        `, [id]);

                        if (cDataRows.length > 0 && cDataRows[0].email) {
                            const candidateObj = cDataRows[0];
                            let trackingUrl = null;
                            if (candidateObj.application_id) {
                                const [links] = await pool.query('SELECT tracking_token FROM application_tracking_links WHERE application_id = ?', [candidateObj.application_id]);
                                if (links.length > 0) {
                                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                                    trackingUrl = baseUrl + '/track/' + links[0].tracking_token;
                                }
                            }
                            
                            await emailService.sendCandidateStageUpdateNotification(
                                candidateObj.email,
                                candidateObj.nombre_candidato,
                                candidateObj.puesto_nombre,
                                updates.etapa_actual,
                                trackingUrl
                            );
                        }
                    } catch (notifyErr) {
                        console.error('⚠️ Could not send stage update notification:', notifyErr.message);
                    }

                    // 📧 NOTIFY LIDER IF HIRED
                    if (updates.etapa_actual === 'Contratado') {
                        // 🏆 UPDATE REFERRAL POINTS IF APPLICABLE
                        try {
                            const [candidate] = await pool.query('SELECT nombre_candidato, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);
                            if (candidate.length > 0) {
                                const [refResult] = await pool.query(`
                                    UPDATE referidos 
                                    SET status = 'Hired', recruiter_points = recruiter_points + 500 
                                    WHERE candidate_name = ? AND vacancy_id = ? AND status != 'Hired'
                                `, [candidate[0].nombre_candidato, candidate[0].vacante_id]);

                                if (refResult.affectedRows > 0) {
                                    console.log(`🏆 Bonus +500 points awarded for successful referral of ${candidate[0].nombre_candidato}`);
                                }
                            }
                        } catch (refError) {
                            console.error('⚠️ Could not update referral points:', refError.message);
                        }

                        try {
                            const [vacancyDetails] = await pool.query(`
                                SELECT v.*, 
                                       u.email as lider_email,
                                       r.email as recruiter_email
                                FROM vacantes v 
                                LEFT JOIN users u ON v.created_by = u.id 
                                LEFT JOIN users r ON v.responsable_rh = r.full_name AND v.tenant_id = r.tenant_id
                                WHERE v.id = ?
                            `, [currentRecord.vacante_id]);

                            if (vacancyDetails.length > 0) {
                                const v = vacancyDetails[0];
                                // Prepare recipients: Leader AND/OR Recruiter
                                const recipients = [v.lider_email, v.recruiter_email].filter(email => email);
                                const emailList = [...new Set(recipients)].join(', ');

                                if (emailList) {
                                    const [candidateRecord] = await pool.query('SELECT * FROM candidatos_seguimiento WHERE id = ?', [id]);
                                    if (candidateRecord.length > 0) {
                                        console.log(`📧 Enviando notificación de contratación a: ${emailList}`);
                                        await emailService.sendCandidateHiredNotification(
                                            emailList,
                                            candidateRecord[0],
                                            v
                                        );
                                    }
                                } else {
                                    console.warn(`⚠️ No se pudo enviar notificación de contratación: No se encontró email para el líder (${v.created_by}) ni para el reclutador (${v.responsable_rh})`);
                                }
                            }
                        } catch (emailError) {
                            console.error('⚠️ Could not send hire notification:', emailError.message);
                        }
                    }
                }
            } catch (historyError) {
                console.error('NASA WARNING: History recording failed (but proceeding with main update):', historyError.message);
            }
        }

        // 2. Data Preparation
        const allowedFields = [
            'vacante_id', 'nombre_candidato', 'etapa_actual', 'fuente_reclutamiento',
            'salario_pretendido', 'fecha_entrevista', 'estado_entrevista',
            'resultado_candidato', 'motivo_no_apto', 'estatus_90_dias',
            'cv_url', 'fecha_postulacion', 'fecha_contratacion',
            'calificacion_tecnica', 'resultado_final',
            'score_tecnico_ia', 'resumen_ia_entrevista', 'audio_transcription',
            'video_snap_url', 'id_externo_linkedin', 'matching_rank',
            'offboarding_sentiment', 'offboarding_reason'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                let val = updates[key];

                // Sanitize: Empty string, null, or undefined to SQL NULL
                if (val === '' || val === null || val === undefined) {
                    filteredUpdates[key] = null;
                }
                // Special handling for numbers: ensure they are numeric
                else if (key === 'salario_pretendido' || key === 'vacante_id') {
                    const num = Number(val);
                    filteredUpdates[key] = isNaN(num) ? null : num;
                }
                // NASA Fix: Truncate ISO dates to YYYY-MM-DD for MySQL
                else if (['fecha_entrevista', 'fecha_postulacion', 'fecha_contratacion'].includes(key)) {
                    if (typeof val === 'string' && val.includes('T')) {
                        filteredUpdates[key] = val.split('T')[0];
                    } else {
                        filteredUpdates[key] = val;
                    }
                }
                else {
                    filteredUpdates[key] = val;
                }
            }
        });

        const fields = Object.keys(filteredUpdates);
        if (fields.length === 0) {
            return res.json({ message: 'No fields to update' });
        }

        // 3. Main Update Query
        const sql = `UPDATE candidatos_seguimiento SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        const values = [...Object.values(filteredUpdates), id];

        console.log('NASA Execute SQL:', sql);
        console.log('NASA Values:', JSON.stringify(values));

        const [result] = await pool.query(sql, values);
        console.log('NASA Result:', result.info);

        await auditService.log(
            req.user?.id || null,
            req.user?.email || null,
            'candidatos_seguimiento',
            id,
            'UPDATE',
            filteredUpdates,
            req.ip
        );

        console.log(`--- NASA UPDATE SUCCESS [ID: ${id}] ---\n`);
        return res.json({ message: 'Actualizado con éxito' });

    } catch (error) {
        console.error('NASA CRITICAL ERROR during update:', error);
        return res.status(500).json({
            error: error.message,
            sqlState: error.sqlState,
            code: error.code,
            stack: error.stack
        });
    }
});

// DELETE Candidato
router.delete('/:id', verifyToken, requireRole(['Superadmin', 'Admin', 'Reclutador']), async (req, res) => {
    const { id } = req.params;
    try {
        // Find if this candidate has a portal account linked
        const [candidate] = await pool.query('SELECT nombre_candidato, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);

        if (candidate.length > 0) {
            // Optional: We do NOT delete relations, since it's a soft delete
            // await pool.query('DELETE FROM historial_etapas WHERE candidato_id = ?', [id]).catch(e => console.log('historial deletion missing table/ref', e.message));
        }

        const [result] = await pool.query('UPDATE candidatos_seguimiento SET deleted_at = NOW(), resultado_final = "Eliminado del Sistema (Soft)" WHERE id = ? AND deleted_at IS NULL', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Candidato no encontrado o ya eliminado' });
        }

        await auditService.log(
            req.user?.id || null,
            req.user?.email || null,
            'candidatos_seguimiento',
            id,
            'DELETE (Soft)',
            { candidateName: candidate.length > 0 ? candidate[0].nombre_candidato : 'Desconocido', vacante_id: candidate.length > 0 ? candidate[0].vacante_id : null },
            req.ip
        );

        res.json({ message: 'Candidato eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting candidato:', error);
        res.status(500).json({ error: 'No se pudo eliminar el candidato debido a dependencias.' });
    }
});

// GET candidate activity logs
router.get('/:id/activity', verifyToken, requireRole(allowedRoles), async (req, res) => {
    const { id } = req.params; // ID de candidatos_seguimiento
    try {
        // Encontrar el candidato_id real (de la tabla candidatos) usando email o link
        const [candidateInfo] = await pool.query(`
            SELECT a.candidato_id 
            FROM applications a
            JOIN candidatos_seguimiento cs ON a.email = (
                SELECT email FROM applications WHERE id = (
                    SELECT MIN(id) FROM applications WHERE nombre = cs.nombre_candidato
                )
            )
            WHERE cs.id = ?
            LIMIT 1
        `, [id]);

        // Versión simplificada si no hay link directo: buscar por nombre y vacante
        let candidateId = candidateInfo.length > 0 ? candidateInfo[0].candidato_id : null;

        if (!candidateId) {
            const [fallback] = await pool.query(`
                SELECT a.candidato_id 
                FROM applications a
                JOIN candidatos_seguimiento cs ON a.vacante_id = cs.vacante_id AND a.nombre = cs.nombre_candidato
                WHERE cs.id = ?
                LIMIT 1
            `, [id]);
            if (fallback.length > 0) candidateId = fallback[0].candidato_id;
        }

        if (!candidateId) {
            return res.json([]); // No hay cuenta asociada o no se encontró link
        }

        const logs = await activityLogService.getCandidateLogs(candidateId);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching candidate logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET audit history for a candidate (For Timeline View)
router.get('/:id/audit', verifyToken, requireRole(allowedRoles), async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                id, 
                user_email, 
                action, 
                changes, 
                created_at,
                entity_name
            FROM system_audit_logs
            WHERE (entity_name = 'candidatos_seguimiento' AND entity_id = ?)
               OR (entity_name = 'candidatos' AND entity_id = (
                   SELECT cedula FROM candidatos_seguimiento WHERE id = ?
               ))
            ORDER BY created_at DESC
            LIMIT 50
        `, [id, id]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching candidate audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});


// POST analyze candidate behavior with AI
router.post('/:id/analyze-behavior', verifyToken, requireRole(allowedRoles), async (req, res) => {
    const { id } = req.params;
    try {
        // Encontrar el candidato_id real (reutilizando lógica similar a /activity)
        const [candidateInfo] = await pool.query(`
            SELECT a.candidato_id 
            FROM applications a
            JOIN candidatos_seguimiento cs ON a.email = (
                SELECT email FROM applications WHERE id = (
                    SELECT MIN(id) FROM applications WHERE nombre = cs.nombre_candidato
                )
            )
            WHERE cs.id = ?
            LIMIT 1
        `, [id]);

        let candidateId = candidateInfo.length > 0 ? candidateInfo[0].candidato_id : null;
        if (!candidateId) {
            const [fallback] = await pool.query(`
                SELECT a.candidato_id FROM applications a
                JOIN candidatos_seguimiento cs ON a.vacante_id = cs.vacante_id AND a.nombre = cs.nombre_candidato
                WHERE cs.id = ? LIMIT 1
            `, [id]);
            if (fallback.length > 0) candidateId = fallback[0].candidato_id;
        }

        if (!candidateId) {
            return res.status(404).json({ error: 'No se encontró una cuenta de portal asociada para este candidato.' });
        }

        const logs = await activityLogService.getCandidateLogs(candidateId);
        if (logs.length === 0) {
            return res.json({
                summary: "Sin actividad suficiente para análisis.",
                engagement_level: "None",
                key_patterns: [],
                recommendation: "Esperar a que el candidato interactúe con el portal."
            });
        }

        const analysis = await aiService.analyzeBehavior(logs);
        res.json(analysis);
    } catch (error) {
        console.error('Error in AI behavior analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Moved before /:id generic route
module.exports = router;
