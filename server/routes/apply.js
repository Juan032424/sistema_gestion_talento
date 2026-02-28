/**
 * POST /api/apply/:token
 * Endpoint público — Sin autenticación requerida
 * Permite que candidatos externos se postulen a una vacante
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /api/apply/:token — Obtener info pública de la vacante
// SIN autenticación — acceso público
// ============================================================
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Buscar vacante por ID o código (token público)
        const [vacantes] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.observaciones,
                v.estado,
                v.prioridad,
                v.fecha_apertura,
                v.fecha_cierre_estimada,
                v.salario_base_ofrecido,
                s.nombre as sede_nombre,
                p.nombre as proceso_nombre
            FROM vacantes v
            LEFT JOIN sedes s ON v.sede_id = s.id
            LEFT JOIN procesos p ON v.proceso_id = p.id
            WHERE v.id = ? AND v.estado = 'Abierta'
        `, [parseInt(token)]);

        if (vacantes.length === 0) {
            return res.status(404).json({ error: 'Vacante no encontrada o no disponible' });
        }

        // Return only public info
        const v = vacantes[0];
        res.json({
            id: v.id,
            titulo: v.puesto_nombre,
            codigo: v.codigo_requisicion,
            descripcion: v.observaciones,
            estado: v.estado,
            ciudad: v.sede_nombre?.includes('Cartagena') ? 'Cartagena, Colombia' : (v.sede_nombre || 'Cartagena, Colombia'),
            sede: v.sede_nombre || 'Sede Principal',
            tipo_trabajo: 'Tiempo Completo', // Default since table might be empty
            proceso: v.proceso_nombre,
            fecha_apertura: v.fecha_apertura,
            fecha_cierre: v.fecha_cierre_estimada,
            salario: v.salario_base_ofrecido > 0 ? `$${parseFloat(v.salario_base_ofrecido).toLocaleString('es-CO')} COP` : 'A convenir',
            empresa: 'DISCOL S.A.S.',
            logo_empresa: null
        });

    } catch (error) {
        console.error('Error getting vacancy for apply:', error);
        res.status(500).json({ error: 'Error al cargar la vacante' });
    }
});

// ============================================================
// POST /api/apply/:token — Recibir postulación
// SIN autenticación — endpoint 100% público
// ============================================================
const AIMatchingEngine = require('../services/AIMatchingEngine');

// ... (rest of imports)

router.post('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const {
            nombres, apellidos, email, telefono,
            ciudad_residencia, nivel_educativo, anos_experiencia,
            cargo_actual, empresa_actual, mensaje, como_se_entero, acepta_terminos
        } = req.body;

        // ... (validations)

        // Verificar vacante
        const [vacantes] = await pool.query(
            "SELECT id, puesto_nombre, codigo_requisicion, observaciones FROM vacantes WHERE id = ? AND estado = 'Abierta'",
            [parseInt(token)]
        );

        if (vacantes.length === 0) return res.status(404).json({ error: 'Vacante no disponible' });

        const vacante = vacantes[0];
        const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;
        const emailLower = email.trim().toLowerCase();

        // 1. Insert in candidatos (master candidate record for the platform)
        const [result] = await pool.query(`
            INSERT INTO candidatos (
                nombre, email, telefono, 
                ciudad, titulo_profesional,
                experiencia_total_anos,
                estado, etapa
            ) VALUES (?, ?, ?, ?, ?, ?, 'Activo', 'Aplicación')
            ON DUPLICATE KEY UPDATE telefono = VALUES(telefono), updated_at = NOW()
        `, [
            nombreCompleto, emailLower, telefono?.trim(),
            ciudad_residencia?.trim() || 'Cartagena', cargo_actual?.trim(),
            parseInt(anos_experiencia) || 0
        ]);

        const candidatoId = result.insertId || (await pool.query('SELECT id FROM candidatos WHERE email = ?', [emailLower]))[0][0].id;

        // 2. Perform AI Matching Analysis
        let aiResult = { score: 0, recommendation: 'Evaluación pendiente' };
        try {
            console.log(`[AI] Analizando compatibilidad de ${nombreCompleto} para ${vacante.puesto_nombre}...`);
            const candidateProfile = {
                nombre: nombreCompleto,
                email: emailLower,
                titulo_actual: cargo_actual,
                empresa_actual: empresa_actual,
                experiencia_anos: parseInt(anos_experiencia) || 0,
                educacion: nivel_educativo,
                ubicacion: ciudad_residencia,
                skills: [cargo_actual, nivel_educativo].filter(Boolean)
            };

            aiResult = await AIMatchingEngine.scoreCandidate(candidateProfile, vacante.observaciones || vacante.puesto_nombre);
        } catch (e) {
            console.log('Skipping AI analysis due to error:', e.message);
        }

        // 3. Insert in candidatos_seguimiento (this is what recruiters see in their dashboard)
        try {
            await pool.query(`
                INSERT INTO candidatos_seguimiento (
                    vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento, 
                    fecha_postulacion, score_tecnico_ia, resumen_ia_entrevista
                ) VALUES (?, ?, 'Postulación', 'Portal', NOW(), ?, ?)
            `, [
                vacante.id, nombreCompleto, aiResult.score || 0, JSON.stringify(aiResult.recommendation)
            ]);
        } catch (e) {
            console.log('Skipping seguimiento insert:', e.message);
        }

        // 4. Save in sourced_candidates for the Hub
        try {
            await pool.query(`
                INSERT INTO sourced_candidates (
                    nombre, email, telefono, cv_text, ai_match_score, ai_analysis, estado
                ) VALUES (?, ?, ?, ?, ?, ?, 'new')
                ON DUPLICATE KEY UPDATE ai_match_score = VALUES(ai_match_score), ai_analysis = VALUES(ai_analysis)
            `, [
                nombreCompleto, emailLower, telefono?.trim(),
                `Candidato aplicado vía web. Cargo: ${cargo_actual}. Exp: ${anos_experiencia}. Mensaje: ${mensaje}`,
                aiResult.score || 0, JSON.stringify(aiResult)
            ]);
        } catch (e) {
            console.log('Skipping sourced_candidates insert:', e.message);
        }

        // 5. Create Notification for Admin
        try {
            await pool.query(`
                INSERT INTO notifications (tipo, titulo, mensaje, user_id)
                VALUES ('nueva_postulacion', ?, ?, 1)
            `, [
                `Nueva postulación: ${vacante.puesto_nombre}`,
                `${nombreCompleto} se ha postulado. Score IA: ${aiResult.score}%`
            ]);
        } catch (e) {
            console.log('Skipping notification:', e.message);
        }


        res.json({
            success: true,
            message: `¡Gracias ${nombres}! Postulación recibida.`,
            score: aiResult.score,
            recommendation: aiResult.recommendation
        });

    } catch (error) {
        console.error('Error in apply:', error);
        res.status(500).json({ error: 'Error al procesar postulación' });
    }
});


// ============================================================
// GET /api/apply — Lista de vacantes abiertas (público)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const [vacantes] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.observaciones,
                v.prioridad,
                v.fecha_apertura,
                v.fecha_cierre_estimada,
                v.salario_base_ofrecido,
                s.nombre as sede_nombre
            FROM vacantes v
            LEFT JOIN sedes s ON v.sede_id = s.id
            WHERE v.estado = 'Abierta'
            ORDER BY v.prioridad DESC, v.fecha_apertura DESC
        `);

        res.json({
            empresa: 'DISCOL S.A.S.',
            ciudad: 'Cartagena, Colombia',
            total_vacantes: vacantes.length,
            vacantes: vacantes.map(v => ({
                id: v.id,
                titulo: v.puesto_nombre,
                codigo: v.codigo_requisicion,
                sede: v.sede_nombre,
                ciudad: v.sede_nombre?.includes('Cartagena') ? 'Cartagena' : (v.sede_nombre || 'Cartagena'),
                tipo: 'Tiempo Completo',
                salario: v.salario_base_ofrecido > 0 ? `$${parseFloat(v.salario_base_ofrecido).toLocaleString('es-CO')} COP` : 'A convenir',
                fecha_cierre: v.fecha_cierre_estimada,
                prioridad: v.prioridad,
                link_postulacion: `/aplicar/${v.id}`
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
