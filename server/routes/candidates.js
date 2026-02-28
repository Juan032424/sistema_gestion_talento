const express = require('express');
const router = express.Router();
const candidateAccountService = require('../services/candidateAccountService');
const { authenticateCandidate, requireEmailVerified, optionalCandidateAuth } = require('../middleware/candidateAuth');
const pool = require('../db');

/**
 * ===================================
 * 🔐 CANDIDATE AUTHENTICATION ROUTES
 * ===================================
 */

/**
 * POST /api/candidates/auth/register
 * Registrar nuevo candidato
 */
router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, nombre, apellido, telefono } = req.body;

        const result = await candidateAccountService.register({
            email,
            password,
            nombre,
            apellido,
            telefono
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('❌ Error en /auth/register:', error);
        res.status(400).json({
            error: error.message || 'Error al registrar candidato'
        });
    }
});

/**
 * POST /api/candidates/auth/login
 * Login de candidato
 */
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await candidateAccountService.login(email, password);

        res.json(result);
    } catch (error) {
        console.error('❌ Error en /auth/login:', error);
        res.status(401).json({
            error: error.message || 'Error al iniciar sesión'
        });
    }
});

/**
 * GET /api/candidates/auth/verify-email/:token
 * Verificar email del candidato
 */
router.get('/auth/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await candidateAccountService.verifyEmail(token);

        res.json(result);
    } catch (error) {
        console.error('❌ Error en /auth/verify-email:', error);
        res.status(400).json({
            error: error.message || 'Error al verificar email'
        });
    }
});

/**
 * POST /api/candidates/auth/resend-verification
 * Reenviar email de verificación
 */
router.post('/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        const result = await candidateAccountService.resendVerificationEmail(email);

        // TODO: Enviar email de verificación

        res.json({
            success: true,
            message: 'Email de verificación enviado'
        });
    } catch (error) {
        console.error('❌ Error en /auth/resend-verification:', error);
        res.status(400).json({
            error: error.message || 'Error al reenviar verificación'
        });
    }
});

/**
 * POST /api/candidates/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const result = await candidateAccountService.requestPasswordReset(email);

        // TODO: Enviar email de recuperación

        res.json({
            success: true,
            message: 'Si el email existe, recibirás un correo con instrucciones'
        });
    } catch (error) {
        console.error('❌ Error en /auth/forgot-password:', error);
        res.status(400).json({
            error: error.message || 'Error al procesar solicitud'
        });
    }
});

/**
 * POST /api/candidates/auth/reset-password
 * Resetear contraseña con token
 */
router.post('/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const result = await candidateAccountService.resetPassword(token, newPassword);

        res.json(result);
    } catch (error) {
        console.error('❌ Error en /auth/reset-password:', error);
        res.status(400).json({
            error: error.message || 'Error al restablecer contraseña'
        });
    }
});

/**
 * ===================================
 * 👤 CANDIDATE PROFILE ROUTES
 * ===================================
 */

/**
 * GET /api/candidates/profile
 * Obtener perfil del candidato autenticado
 */
router.get('/profile', authenticateCandidate, async (req, res) => {
    try {
        const profile = await candidateAccountService.getProfile(req.candidate.id);

        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('❌ Error en /profile:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener perfil'
        });
    }
});

/**
 * PUT /api/candidates/profile
 * Actualizar perfil del candidato
 */
router.put('/profile', authenticateCandidate, async (req, res) => {
    try {
        const updates = req.body;

        const result = await candidateAccountService.updateProfile(req.candidate.id, updates);

        res.json(result);
    } catch (error) {
        console.error('❌ Error en /profile PUT:', error);
        res.status(400).json({
            error: error.message || 'Error al actualizar perfil'
        });
    }
});

/**
 * ===================================
 * 📄 CANDIDATE SKILLS & EXPERIENCE
 * ===================================
 */

/**
 * POST /api/candidates/skills
 * Agregar habilidad
 */
router.post('/skills', authenticateCandidate, async (req, res) => {
    try {
        const { habilidad, nivel, anos_experiencia } = req.body;

        await pool.query(
            `INSERT INTO candidate_skills (candidate_account_id, habilidad, nivel, anos_experiencia) 
            VALUES (?, ?, ?, ?)`,
            [req.candidate.id, habilidad, nivel || 'Intermedio', anos_experiencia || 0]
        );

        res.json({
            success: true,
            message: 'Habilidad agregada'
        });
    } catch (error) {
        console.error('❌ Error en /skills POST:', error);
        res.status(400).json({
            error: error.message || 'Error al agregar habilidad'
        });
    }
});

/**
 * DELETE /api/candidates/skills/:id
 * Eliminar habilidad
 */
router.delete('/skills/:id', authenticateCandidate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM candidate_skills WHERE id = ? AND candidate_account_id = ?',
            [req.params.id, req.candidate.id]
        );

        res.json({
            success: true,
            message: 'Habilidad eliminada'
        });
    } catch (error) {
        console.error('❌ Error en /skills DELETE:', error);
        res.status(400).json({
            error: error.message || 'Error al eliminar habilidad'
        });
    }
});

/**
 * POST /api/candidates/education
 * Agregar educación
 */
router.post('/education', authenticateCandidate, async (req, res) => {
    try {
        const { institucion, titulo, nivel_educativo, area_estudio, fecha_inicio, fecha_fin, en_curso, descripcion } = req.body;

        await pool.query(
            `INSERT INTO candidate_education 
            (candidate_account_id, institucion, titulo, nivel_educativo, area_estudio, fecha_inicio, fecha_fin, en_curso, descripcion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.candidate.id, institucion, titulo, nivel_educativo, area_estudio, fecha_inicio, fecha_fin, en_curso || false, descripcion]
        );

        res.json({
            success: true,
            message: 'Educación agregada'
        });
    } catch (error) {
        console.error('❌ Error en /education POST:', error);
        res.status(400).json({
            error: error.message || 'Error al agregar educación'
        });
    }
});

/**
 * DELETE /api/candidates/education/:id
 * Eliminar educación
 */
router.delete('/education/:id', authenticateCandidate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM candidate_education WHERE id = ? AND candidate_account_id = ?',
            [req.params.id, req.candidate.id]
        );

        res.json({
            success: true,
            message: 'Educación eliminada'
        });
    } catch (error) {
        console.error('❌ Error en /education DELETE:', error);
        res.status(400).json({
            error: error.message || 'Error al eliminar educación'
        });
    }
});

/**
 * POST /api/candidates/experience
 * Agregar experiencia laboral
 */
router.post('/experience', authenticateCandidate, async (req, res) => {
    try {
        const { empresa, cargo, tipo_empleo, fecha_inicio, fecha_fin, trabajo_actual, descripcion, logros, ciudad, pais } = req.body;

        await pool.query(
            `INSERT INTO candidate_experience 
            (candidate_account_id, empresa, cargo, tipo_empleo, fecha_inicio, fecha_fin, trabajo_actual, descripcion, logros, ciudad, pais) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.candidate.id, empresa, cargo, tipo_empleo, fecha_inicio, fecha_fin, trabajo_actual || false, descripcion, logros, ciudad, pais]
        );

        res.json({
            success: true,
            message: 'Experiencia agregada'
        });
    } catch (error) {
        console.error('❌ Error en /experience POST:', error);
        res.status(400).json({
            error: error.message || 'Error al agregar experiencia'
        });
    }
});

/**
 * DELETE /api/candidates/experience/:id
 * Eliminar experiencia
 */
router.delete('/experience/:id', authenticateCandidate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM candidate_experience WHERE id = ? AND candidate_account_id = ?',
            [req.params.id, req.candidate.id]
        );

        res.json({
            success: true,
            message: 'Experiencia eliminada'
        });
    } catch (error) {
        console.error('❌ Error en /experience DELETE:', error);
        res.status(400).json({
            error: error.message || 'Error al eliminar experiencia'
        });
    }
});

/**
 * ===================================
 * 📬 CANDIDATE APPLICATIONS
 * ===================================
 */

/**
 * GET /api/candidates/applications
 * Obtener postulaciones del candidato
 */
router.get('/applications', authenticateCandidate, async (req, res) => {
    try {
        const [applications] = await pool.query(
            `SELECT 
                a.id,
                a.vacante_id,
                a.estado,
                a.auto_match_score,
                a.fecha_postulacion,
                a.fecha_ultima_actualizacion,
                a.notas_reclutador,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.salario_base,
                v.presupuesto_max,
                v.estado as vacante_estado
            FROM applications a
            INNER JOIN vacantes v ON a.vacante_id = v.id
            WHERE (a.candidate_account_id = ? OR a.email = ?)
            ORDER BY a.fecha_postulacion DESC`,
            [req.candidate.id, req.candidate.email]
        );

        res.json({
            success: true,
            applications
        });
    } catch (error) {
        console.error('❌ Error en /applications:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener postulaciones'
        });
    }
});

/**
 * GET /api/candidates/applications/:id
 * Obtener detalle de una postulación
 */
router.get('/applications/:id', authenticateCandidate, async (req, res) => {
    try {
        const [applications] = await pool.query(
            `SELECT 
                a.*,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.observaciones as vacante_descripcion,
                v.salario_base,
                v.presupuesto_max,
                v.estado as vacante_estado
            FROM applications a
            INNER JOIN vacantes v ON a.vacante_id = v.id
            WHERE a.id = ? AND a.candidate_account_id = ?`,
            [req.params.id, req.candidate.id]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                error: 'Postulación no encontrada'
            });
        }

        res.json({
            success: true,
            application: applications[0]
        });
    } catch (error) {
        console.error('❌ Error en /applications/:id:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener postulación'
        });
    }
});

/**
 * ===================================
 * 💾 SAVED JOBS
 * ===================================
 */

/**
 * POST /api/candidates/saved-jobs/:vacanteId
 * Guardar vacante
 */
router.post('/saved-jobs/:vacanteId', authenticateCandidate, async (req, res) => {
    try {
        const { notas } = req.body;

        await pool.query(
            `INSERT INTO candidate_saved_jobs (candidate_account_id, vacante_id, notas) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE notas = ?`,
            [req.candidate.id, req.params.vacanteId, notas, notas]
        );

        res.json({
            success: true,
            message: 'Vacante guardada'
        });
    } catch (error) {
        console.error('❌ Error en /saved-jobs POST:', error);
        res.status(400).json({
            error: error.message || 'Error al guardar vacante'
        });
    }
});

/**
 * DELETE /api/candidates/saved-jobs/:vacanteId
 * Eliminar vacante guardada
 */
router.delete('/saved-jobs/:vacanteId', authenticateCandidate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM candidate_saved_jobs WHERE candidate_account_id = ? AND vacante_id = ?',
            [req.candidate.id, req.params.vacanteId]
        );

        res.json({
            success: true,
            message: 'Vacante eliminada de guardados'
        });
    } catch (error) {
        console.error('❌ Error en /saved-jobs DELETE:', error);
        res.status(400).json({
            error: error.message || 'Error al eliminar vacante guardada'
        });
    }
});

/**
 * GET /api/candidates/saved-jobs
 * Obtener vacantes guardadas
 */
router.get('/saved-jobs', authenticateCandidate, async (req, res) => {
    try {
        const [savedJobs] = await pool.query(
            `SELECT 
                csj.id,
                csj.vacante_id,
                csj.notas,
                csj.created_at,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.salario_base,
                v.presupuesto_max,
                v.estado,
                v.fecha_apertura
            FROM candidate_saved_jobs csj
            INNER JOIN vacantes v ON csj.vacante_id = v.id
            WHERE csj.candidate_account_id = ?
            ORDER BY csj.created_at DESC`,
            [req.candidate.id]
        );

        res.json({
            success: true,
            savedJobs
        });
    } catch (error) {
        console.error('❌ Error en /saved-jobs:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener vacantes guardadas'
        });
    }
});

/**
 * ===================================
 * 🔔 NOTIFICATIONS
 * ===================================
 */

/**
 * GET /api/candidates/notifications
 * Obtener notificaciones
 */
router.get('/notifications', authenticateCandidate, async (req, res) => {
    try {
        const [notifications] = await pool.query(
            `SELECT * FROM candidate_notifications 
            WHERE candidate_account_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50`,
            [req.candidate.id]
        );

        const [unreadCount] = await pool.query(
            'SELECT COUNT(*) as count FROM candidate_notifications WHERE candidate_account_id = ? AND leida = FALSE',
            [req.candidate.id]
        );

        res.json({
            success: true,
            notifications,
            unreadCount: unreadCount[0]?.count || 0
        });
    } catch (error) {
        console.error('❌ Error en /notifications:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener notificaciones'
        });
    }
});

/**
 * PUT /api/candidates/notifications/:id/read
 * Marcar notificación como leída
 */
router.put('/notifications/:id/read', authenticateCandidate, async (req, res) => {
    try {
        await pool.query(
            `UPDATE candidate_notifications 
            SET leida = TRUE, fecha_leida = NOW() 
            WHERE id = ? AND candidate_account_id = ?`,
            [req.params.id, req.candidate.id]
        );

        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });
    } catch (error) {
        console.error('❌ Error en /notifications/:id/read:', error);
        res.status(400).json({
            error: error.message || 'Error al marcar notificación'
        });
    }
});

/**
 * ===================================
 * 🌐 PORTAL CANDIDATES MANAGEMENT
 * ===================================
 */

/**
 * GET /api/candidates/portal/all
 * Obtener todos los candidatos registrados en el portal (para admin)
 */
router.get('/portal/all', async (req, res) => {
    try {
        const [candidates] = await pool.query(`
            SELECT 
                c.id,
                c.nombre,
                c.email,
                c.telefono,
                c.titulo_profesional,
                c.created_at,
                (SELECT COUNT(*) FROM candidate_activity_logs WHERE candidate_id = c.id) as activity_count,
                (SELECT MAX(created_at) FROM candidate_activity_logs WHERE candidate_id = c.id AND activity_type = 'LOGIN') as last_login
            FROM candidatos c
            WHERE c.password_hash IS NOT NULL -- Solo mostrar candidatos que se han registrado con contraseña (portal user)
            ORDER BY c.created_at DESC
        `);

        res.json(candidates.map(c => ({
            ...c,
            email_verified: true, // Asumimos verificado por ahora o agregar campo si existe
            apellido: '' // La tabla candidatos usa 'nombre' completo
        })));
    } catch (error) {
        console.error('❌ Error en /portal/all:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener candidatos del portal'
        });
    }
});

/**
 * GET /api/candidates/portal/:id
 * Obtener detalle de un candidato del portal
 */
router.get('/portal/:id', async (req, res) => {
    try {
        const [candidates] = await pool.query(
            `SELECT * FROM candidatos WHERE id = ?`,
            [req.params.id]
        );

        if (candidates.length === 0) {
            return res.status(404).json({
                error: 'Candidato no encontrado'
            });
        }

        const candidate = candidates[0];
        // Enriquecer o adaptar campos si es necesario
        res.json({
            ...candidate,
            apellido: '', // Adaptador para frontend
            email_verified: true
        });
    } catch (error) {
        console.error('❌ Error en /portal/:id:', error);
        res.status(500).json({
            error: error.message || 'Error al obtener candidato'
        });
    }
});

module.exports = router;
