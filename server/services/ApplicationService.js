const pool = require('../db');
const aiService = require('./aiService');
const activityLogService = require('./ActivityLogService');

/**
 * ApplicationService - Sistema de Postulaciones y Auto-Matching
 * Conecta candidatos con vacantes automáticamente
 */
class ApplicationService {
    constructor() {
        this.name = 'Application Service';
    }

    /**
     * Candidato se postula a una vacante
     */
    async applyToJob(vacancyId, candidateData) {
        console.log(`[${this.name}] Starting applyToJob for vacancy ${vacancyId}`, candidateData);

        try {
            // 1. Obtener información de la vacante
            console.log(`[${this.name}] Fetching vacancy ${vacancyId}`);
            const [vacancies] = await pool.query(
                'SELECT * FROM vacantes WHERE id = ?',
                [vacancyId]
            );

            if (vacancies.length === 0) {
                console.error(`[${this.name}] Vacancy not found`);
                throw new Error('Vacante no encontrada');
            }

            const vacancy = vacancies[0];
            console.log(`[${this.name}] Vacancy found: ${vacancy.puesto_nombre}`);

            // 2. Crear o encontrar candidato EN LA TABLA PRINCIPAL (candidatos)
            let candidatoId = candidateData.candidato_id;

            if (!candidatoId && candidateData.email) {
                console.log(`[${this.name}] Checking for existing candidate by email: ${candidateData.email}`);
                const [existing] = await pool.query(
                    'SELECT id FROM candidatos WHERE email = ?',
                    [candidateData.email]
                );

                if (existing.length > 0) {
                    candidatoId = existing[0].id;
                    console.log(`[${this.name}] Existing candidate found: ${candidatoId}`);
                } else {
                    console.log(`[${this.name}] Creating NEW candidate in 'candidatos'`);
                    try {
                        const [result] = await pool.query(
                            `INSERT INTO candidatos 
                            (nombre, email, telefono, titulo_profesional, experiencia_total_anos, 
                             fuente, etapa, estado, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                            [
                                candidateData.nombre,
                                candidateData.email,
                                candidateData.telefono || '',
                                candidateData.titulo_profesional || '',
                                candidateData.experiencia_anos || 0,
                                'LinkedIn', // CAMBIO SEGURO: Usar valor estándar por si 'Portal Público' falla validación
                                'POSTULACIÓN',
                                'Activo',
                            ]
                        );
                        candidatoId = result.insertId;
                        console.log(`[${this.name}] New candidate created with ID: ${candidatoId}`);
                    } catch (err) {
                        console.error(`[${this.name}] Error creating candidate:`, err);
                        throw new Error(`Failed to create candidate: ${err.message}`);
                    }
                }
            }

            // 3. Calcular match score automático
            console.log(`[${this.name}] Calculating match score...`);
            const matchScore = await this.calculateMatchScore(vacancy, candidateData);

            // 4. Crear la aplicación (vinculando con vacante y candidato)
            console.log(`[${this.name}] Inserting into 'applications'...`);
            let application;
            try {
                const [appResult] = await pool.query(
                    `INSERT INTO applications 
                    (vacante_id, candidato_id, candidate_account_id, nombre, email, telefono, cv_url, 
                    carta_presentacion, experiencia_anos, salario_esperado, 
                    disponibilidad, auto_match_score, estado, fecha_postulacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nueva', NOW())`,
                    [
                        vacancyId,
                        candidatoId,
                        candidateData.candidateAccountId || null, // Guardar ID de cuenta si existe
                        candidateData.nombre,
                        candidateData.email,
                        candidateData.telefono,
                        candidateData.cv_url || '',
                        candidateData.carta_presentacion || '',
                        candidateData.experiencia_anos || 0,
                        candidateData.salario_esperado || 0,
                        candidateData.disponibilidad || 'Inmediata',
                        matchScore
                    ]
                );
                application = { insertId: appResult.insertId };
                console.log(`[${this.name}] Application created with ID: ${application.insertId}`);

                // Log activity if candidate has an account
                if (candidateData.candidateAccountId) {
                    await activityLogService.logActivity(
                        candidateData.candidateAccountId,
                        'APPLY',
                        `Se postuló a la vacante ${vacancy.puesto_nombre}`,
                        vacancyId,
                        { applicationId: application.insertId }
                    );
                }
            } catch (err) {
                console.error(`[${this.name}] Error inserting application:`, err);
                // Log to file for debugging
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const logPath = path.join(__dirname, '../logs/application_errors.log');
                    const logDir = path.dirname(logPath);
                    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
                    fs.appendFileSync(logPath, `[${new Date().toISOString()}] INSERT ERROR: ${err.message}\nSQL: ${err.sql}\nParams: ${JSON.stringify(err.sqlMessage)}\n\n`);
                } catch (e) { console.error('Failed to write log:', e); }

                throw new Error(`Failed to insert application: ${err.message}`);
            }

            // 5. Update additional info
            if (candidateData.salario_esperado) {
                // Non-critical
                try {
                    await pool.query('UPDATE candidatos SET salario_esperado = ? WHERE id = ?', [candidateData.salario_esperado, candidatoId]);
                } catch (e) { console.warn('Failed to update salary', e); }
            }

            // 6. Link candidato con vacante
            console.log(`[${this.name}] Linking candidate_vacante...`);
            try {
                await pool.query(
                    `INSERT INTO candidato_vacante (candidato_id, vacante_id, estado_etapa, fecha_asignacion)
                    VALUES (?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE estado_etapa = 'POSTULACIÓN', fecha_actualizacion = NOW()`,
                    [candidatoId, vacancyId, 'POSTULACIÓN']
                );
            } catch (e) {
                console.error(`[${this.name}] Error linking candidate_vacante (non-fatal):`, e);
            }

            // 7. Tracking record configuration 
            // Only try if table exists and matches schema, wrap in try/catch
            try {
                console.log(`[${this.name}] Inserting into candidatos_seguimiento...`);
                await pool.query(
                    `INSERT INTO candidatos_seguimiento 
                    (vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento, 
                     salario_pretendido, cv_url, fecha_postulacion, estado_entrevista)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Pendiente')`,
                    [
                        vacancyId,
                        candidateData.nombre,
                        'Postulación',
                        'Portal',
                        candidateData.salario_esperado || 0,
                        candidateData.cv_url || ''
                    ]
                );
            } catch (e) {
                console.warn(`[${this.name}] Failed to insert into candidatos_seguimiento (ignoring):`, e.message);
            }

            // Public posting update
            try {
                await pool.query(
                    `UPDATE public_job_postings SET applications_count = applications_count + 1 
                    WHERE vacante_id = ?`,
                    [vacancyId]
                );
            } catch (e) { console.warn('Failed to update counts', e); }


            // 11. Tracking Link
            console.log(`[${this.name}] Creating tracking link...`);
            let trackingUrl = '';
            try {
                const trackingService = require('./ApplicationTrackingService');
                const trackingResult = await trackingService.createTrackingLink(application.insertId);
                trackingUrl = trackingResult.trackingUrl;

                // 12. Send Notification
                await trackingService.sendNotification(
                    application.insertId,
                    'nueva_postulacion',
                    '¡Tu postulación ha sido recibida!',
                    `Gracias por postularte a ${vacancy.puesto_nombre}. Tu perfil tiene un match del ${matchScore}% con esta vacante.`,
                    trackingResult.trackingUrl
                );
            } catch (err) {
                console.error(`[${this.name}] Error in tracking/notification service:`, err);
                // Don't fail the whole request just because notification failed
            }

            console.log(`[${this.name}] ✅ Apply process completed successfully.`);

            return {
                success: true,
                applicationId: application.insertId,
                candidatoId: candidatoId,
                matchScore,
                trackingUrl: trackingUrl || '#error',
                message: '¡Tu postulación ha sido enviada exitosamente!'
            };

        } catch (error) {
            console.error(`[${this.name}] CRITICAL ERROR in applyToJob:`, error);
            throw error;
        }
    }

    /**
     * Calcular score de match automático
     */
    async calculateMatchScore(vacancy, candidateData) {
        try {
            // Factores de scoring
            let totalScore = 0;
            let factors = [];

            // 1. Experiencia (30 puntos)
            const reqExp = vacancy.experiencia_requerida || 0;
            const candExp = candidateData.experiencia_anos || 0;

            if (candExp >= reqExp) {
                const expScore = Math.min(30, 20 + (candExp - reqExp) * 2);
                totalScore += expScore;
                factors.push({ factor: 'experiencia', score: expScore, detail: `${candExp} años vs ${reqExp} requeridos` });
            } else {
                const expScore = Math.max(0, (candExp / reqExp) * 20);
                totalScore += expScore;
                factors.push({ factor: 'experiencia', score: expScore, detail: `${candExp} años (menos que requerido)` });
            }

            // 2. Título/Palabras clave (30 puntos)
            if (candidateData.titulo_profesional && vacancy.puesto_nombre) {
                const titleScore = this.compareTitles(
                    candidateData.titulo_profesional,
                    vacancy.puesto_nombre
                );
                totalScore += titleScore;
                factors.push({ factor: 'titulo', score: titleScore, detail: 'Similitud de título' });
            }

            // 3. Disponibilidad (20 puntos)
            if (candidateData.disponibilidad) {
                const dispScore = candidateData.disponibilidad.toLowerCase().includes('inmediata') ? 20 : 10;
                totalScore += dispScore;
                factors.push({ factor: 'disponibilidad', score: dispScore, detail: candidateData.disponibilidad });
            }

            // 4. Salario (20 puntos)
            if (candidateData.salario_esperado && vacancy.salario_min) {
                const salaryDiff = Math.abs(candidateData.salario_esperado - vacancy.salario_min) / vacancy.salario_min;
                const salaryScore = Math.max(0, 20 - (salaryDiff * 40));
                totalScore += salaryScore;
                factors.push({ factor: 'salario', score: salaryScore, detail: 'Expectativa salarial alineada' });
            } else {
                totalScore += 10; // Score neutral
            }

            // Normalizar a 0-100
            const finalScore = Math.min(100, Math.round(totalScore));

            console.log(`[Match Score] ${finalScore}% - Factors:`, factors);

            return finalScore;

        } catch (error) {
            console.error('Error calculating match score:', error);
            return 50; // Score por defecto en caso de error
        }
    }

    /**
     * Comparar títulos profesionales
     */
    compareTitles(candidateTitle, vacancyTitle) {
        const normalize = (str) => str.toLowerCase().trim();
        const cTitle = normalize(candidateTitle);
        const vTitle = normalize(vacancyTitle);

        // Coincidencia exacta
        if (cTitle === vTitle) return 30;

        // Palabras clave comunes
        const cWords = new Set(cTitle.split(/\s+/));
        const vWords = new Set(vTitle.split(/\s+/));

        let commonWords = 0;
        cWords.forEach(word => {
            if (vWords.has(word) && word.length > 3) commonWords++;
        });

        const similarity = (commonWords / Math.max(cWords.size, vWords.size)) * 30;
        return Math.round(similarity);
    }

    /**
     * Obtener postulaciones de una vacante
     */
    async getApplicationsByVacancy(vacancyId, filters = {}) {
        try {
            let query = `
                SELECT a.*, 
                       v.puesto_nombre,
                       c.nombre as candidato_nombre_interno
                FROM applications a
                LEFT JOIN vacantes v ON a.vacante_id = v.id
                LEFT JOIN candidatos c ON a.candidato_id = c.id
                WHERE a.vacante_id = ?
            `;
            const params = [vacancyId];

            if (filters.estado) {
                query += ` AND a.estado = ?`;
                params.push(filters.estado);
            }

            query += ` ORDER BY a.auto_match_score DESC, a.fecha_postulacion DESC`;

            const [applications] = await pool.query(query, params);

            return applications;

        } catch (error) {
            console.error('Error getting applications:', error);
            throw error;
        }
    }

    /**
     * Obtener postulaciones de un candidato
     */
    async getApplicationsByCandidate(candidateEmail) {
        try {
            const [applications] = await pool.query(
                `SELECT a.*, v.puesto_nombre, v.ubicacion, v.salario_min, v.salario_max,
                        pj.slug
                FROM applications a
                LEFT JOIN vacantes v ON a.vacante_id = v.id
                LEFT JOIN public_job_postings pj ON v.id = pj.vacante_id
                WHERE a.email = ?
                ORDER BY a.fecha_postulacion DESC`,
                [candidateEmail]
            );

            return applications;

        } catch (error) {
            console.error('Error getting candidate applications:', error);
            throw error;
        }
    }

    /**
     * Actualizar estado de postulación
     */
    async updateApplicationStatus(applicationId, newStatus, notes = null) {
        try {
            const updates = ['estado = ?', 'fecha_ultima_actualizacion = NOW()'];
            const params = [newStatus];

            if (notes) {
                updates.push('notas_reclutador = ?');
                params.push(notes);
            }

            params.push(applicationId);

            await pool.query(
                `UPDATE applications SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            // Crear notificación para candidato
            const [application] = await pool.query(
                'SELECT * FROM applications WHERE id = ?',
                [applicationId]
            );

            if (application.length > 0) {
                await this.createNotification({
                    user_type: 'candidato',
                    user_id: application[0].candidato_id || 0,
                    tipo: 'estado_cambio',
                    titulo: `Actualización en tu postulación`,
                    mensaje: `Tu postulación cambió a: ${newStatus}`,
                    related_entity: 'application',
                    related_id: applicationId
                });
            }

            return { success: true };

        } catch (error) {
            console.error('Error updating application status:', error);
            throw error;
        }
    }

    /**
     * Buscar matches automáticos para una vacante
     */
    async findAutoMatches(vacancyId, minScore = 70) {
        try {
            // Obtener vacante
            const [vacancies] = await pool.query(
                'SELECT * FROM vacantes WHERE id = ?',
                [vacancyId]
            );

            if (vacancies.length === 0) return [];

            const vacancy = vacancies[0];

            // Buscar candidatos externos que no han aplicado
            const [candidates] = await pool.query(
                `SELECT ec.* FROM external_candidates ec
                WHERE ec.id NOT IN (
                    SELECT COALESCE(candidato_id, 0) FROM applications WHERE vacante_id = ?
                )
                LIMIT 100`,
                [vacancyId]
            );

            const matches = [];

            for (const candidate of candidates) {
                const score = await this.calculateMatchScore(vacancy, {
                    experiencia_anos: candidate.experiencia_total_anos,
                    titulo_profesional: candidate.titulo_profesional,
                    disponibilidad: 'Disponible'
                });

                if (score >= minScore) {
                    matches.push({
                        candidate,
                        score,
                        vacancy: {
                            id: vacancy.id,
                            puesto_nombre: vacancy.puesto_nombre,
                            ubicacion: vacancy.ubicacion
                        }
                    });

                    // Guardar match en la base de datos
                    await pool.query(
                        `INSERT INTO auto_matches 
                        (vacante_id, external_candidate_id, match_score, skills_match_score)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE match_score = ?, updated_at = NOW()`,
                        [vacancyId, candidate.id, score, score, score]
                    );
                }
            }

            // Ordenar por score
            matches.sort((a, b) => b.score - a.score);

            return matches;

        } catch (error) {
            console.error('Error finding auto matches:', error);
            throw error;
        }
    }

    /**
     * Crear notificación
     */
    async createNotification(data) {
        try {
            await pool.query(
                `INSERT INTO notifications 
                (user_type, user_id, tipo, titulo, mensaje, related_entity, related_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.user_type,
                    data.user_id,
                    data.tipo,
                    data.titulo,
                    data.mensaje,
                    data.related_entity || null,
                    data.related_id || null
                ]
            );
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    /**
     * Obtener estadísticas de postulaciones
     */
    async getApplicationStats(vacancyId = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Nueva' THEN 1 ELSE 0 END) as nuevas,
                    SUM(CASE WHEN estado = 'En Revisión' THEN 1 ELSE 0 END) as en_revision,
                    SUM(CASE WHEN estado = 'Preseleccionado' THEN 1 ELSE 0 END) as preseleccionados,
                    SUM(CASE WHEN estado = 'Entrevista' THEN 1 ELSE 0 END) as entrevistas,
                    SUM(CASE WHEN estado = 'Contratado' THEN 1 ELSE 0 END) as contratados,
                    AVG(auto_match_score) as score_promedio
                FROM applications
            `;

            if (vacancyId) {
                query += ` WHERE vacante_id = ?`;
            }

            const [stats] = await pool.query(query, vacancyId ? [vacancyId] : []);

            return stats[0];

        } catch (error) {
            console.error('Error getting application stats:', error);
            throw error;
        }
    }
}

module.exports = new ApplicationService();
