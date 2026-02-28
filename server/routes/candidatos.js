const express = require('express');
const router = express.Router();
const pool = require('../db');
const activityLogService = require('../services/ActivityLogService');
const aiService = require('../services/aiService');

// GET all candidatos with vacante info
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, v.puesto_nombre, v.codigo_requisicion, v.fecha_apertura
            FROM candidatos_seguimiento c
            JOIN vacantes v ON c.vacante_id = v.id
            ORDER BY c.id DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET bottleneck analysis
router.get('/analytics/bottlenecks', async (req, res) => {
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
router.get('/vacante/:vacanteId', async (req, res) => {
    const { vacanteId } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM candidatos_seguimiento WHERE vacante_id = ?', [vacanteId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single candidato (Generic ID must be LAST)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM candidatos_seguimiento WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Candidato no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Create Candidato
router.post('/', async (req, res) => {
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

        res.json({ id: result.insertId, message: 'Candidato registrado exitosamente' });
    } catch (error) {
        console.error('Error in POST /candidatos:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find if this candidate has a portal account linked
        const [candidate] = await pool.query('SELECT nombre_candidato, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);

        if (candidate.length > 0) {
            // Optional: delete matching logic in applications / history if needed
            await pool.query('DELETE FROM historial_etapas WHERE candidato_id = ?', [id]);
            await pool.query('DELETE FROM ai_evaluations WHERE candidate_id = ?', [id]);
        }

        const [result] = await pool.query('DELETE FROM candidatos_seguimiento WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Candidato no encontrado o ya eliminado' });
        }
        res.json({ message: 'Candidato eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting candidato:', error);
        res.status(500).json({ error: 'No se pudo eliminar el candidato debido a dependencias.' });
    }
});

// GET candidate activity logs
router.get('/:id/activity', async (req, res) => {
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

// POST analyze candidate behavior with AI
router.post('/:id/analyze-behavior', async (req, res) => {
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
