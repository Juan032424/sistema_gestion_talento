const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyPassword } = require('../utils/candidateAuth');
const candidateAccountService = require('./candidateAccountService'); // Para delegar operaciones del nuevo sistema

class CandidateAuthService {

    async register(data) {
        const { nombre, email, telefono, password, ciudad, titulo_profesional } = data;

        // Check if email already exists in legacy
        const [existing] = await pool.query(
            'SELECT id FROM candidatos WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('El email ya está registrado');
        }

        // Check if email exists in new system too (to prevent confusion)
        const [existingNew] = await pool.query(
            'SELECT id FROM candidate_accounts WHERE email = ?',
            [email]
        );

        if (existingNew.length > 0) {
            throw new Error('El email ya está registrado en el nuevo sistema. Por favor inicia sesión.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert candidate
        const [result] = await pool.query(`
            INSERT INTO candidatos (
                nombre, email, telefono, password_hash, ciudad, titulo_profesional,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [nombre, email, telefono, hashedPassword, ciudad, titulo_profesional]);

        const candidateId = result.insertId;

        // Generate token
        const token = jwt.sign(
            { id: candidateId, email, type: 'candidate', system: 'legacy' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            candidate: {
                id: candidateId,
                nombre,
                email,
                telefono,
                ciudad,
                titulo_profesional
            }
        };
    }

    async login(email, password) {
        console.log(`🔐 Intento de login para: ${email}`);

        // Función interna para buscar usuario por email en ambos sistemas
        const findUser = async (searchEmail) => {
            // 1. Legacy
            const [candidates] = await pool.query('SELECT * FROM candidatos WHERE email = ?', [searchEmail]);
            if (candidates.length > 0) return { candidate: candidates[0], isLegacy: true };

            // 2. New System
            const [newAccounts] = await pool.query('SELECT * FROM candidate_accounts WHERE email = ?', [searchEmail]);
            if (newAccounts.length > 0) return { candidate: newAccounts[0], isLegacy: false };

            return null;
        };

        // Primer intento: Email tal cual
        let found = await findUser(email);

        // Segundo intento: Normalización Punycode (para dominios con ñ, á, etc.)
        if (!found && email.includes('@')) {
            try {
                const parts = email.split('@');
                if (parts.length === 2 && /[^\u0000-\u007F]/.test(parts[1])) { // Si tiene caracteres no ASCII en dominio
                    const domain = new URL('http://' + parts[1]).hostname; // Conversión a punycode
                    const punycodeEmail = `${parts[0]}@${domain}`;
                    console.log(`⚠️ Buscando versión Punycode: ${punycodeEmail}`);
                    found = await findUser(punycodeEmail);
                }
            } catch (e) {
                console.log('Error normalizando email:', e);
            }
        }

        if (!found) {
            console.log('❌ Login fallido: Usuario no encontrado');
            throw new Error('Credenciales inválidas');
        }

        const { candidate, isLegacy } = found;
        console.log(`✅ Usuario encontrado (Legacy: ${isLegacy}) ID: ${candidate.id}`);

        // Verificación de Contraseña
        if (isLegacy) {
            // Legacy usa bcrypt directo
            if (!candidate.password_hash) throw new Error('Cuenta sin contraseña');
            const valid = await bcrypt.compare(password, candidate.password_hash);
            if (!valid) throw new Error('Credenciales inválidas');
        } else {
            // New system
            const valid = await bcrypt.compare(password, candidate.password_hash);
            if (!valid) throw new Error('Credenciales inválidas');
        }

        // 3. Generar token COMPATIBLE
        const token = jwt.sign(
            { id: candidate.id, email: candidate.email, type: 'candidate', system: isLegacy ? 'legacy' : 'new' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            candidate: {
                id: candidate.id,
                nombre: candidate.nombre,
                email: candidate.email,
                telefono: candidate.telefono,
                ciudad: candidate.ciudad || '',
                titulo_profesional: candidate.titulo_profesional || ''
            }
        };
    }

    async getProfile(candidateId, system = 'legacy') {
        if (system === 'new') {
            // Delegar al nuevo servicio
            try {
                const profile = await candidateAccountService.getProfile(candidateId);
                // Mapear al formato esperado por el frontend actual si es necesario
                return {
                    id: profile.id,
                    nombre: profile.nombre,
                    email: profile.email,
                    telefono: profile.telefono,
                    ciudad: profile.ciudad,
                    titulo_profesional: profile.titulo_profesional,
                    // Otros campos extra se pasan igual
                    ...profile
                };
            } catch (error) {
                throw new Error('Candidato no encontrado en sistema nuevo');
            }
        } else {
            // Legacy
            const [candidates] = await pool.query(
                'SELECT id, nombre, email, telefono, ciudad, titulo_profesional FROM candidatos WHERE id = ?',
                [candidateId]
            );

            if (candidates.length === 0) {
                throw new Error('Candidato no encontrado');
            }

            return candidates[0];
        }
    }

    async updateProfile(candidateId, data, system = 'legacy') {
        if (system === 'new') {
            return await candidateAccountService.updateProfile(candidateId, data);
        } else {
            const { nombre, telefono, ciudad, titulo_profesional } = data;

            await pool.query(`
                UPDATE candidatos 
                SET nombre = ?, telefono = ?, ciudad = ?, titulo_profesional = ?, updated_at = NOW()
                WHERE id = ?
            `, [nombre, telefono, ciudad, titulo_profesional, candidateId]);

            return this.getProfile(candidateId, 'legacy');
        }
    }

    async getMyApplications(candidateId, system = 'legacy') {
        if (system === 'new') {
            // TODO: Implementar búsqueda en tabla 'applications' o 'postulaciones_agiles' por candidate_account_id
            return [];
        }
        // Las aplicaciones en postulaciones_agiles se asocian por candidato_id
        // Si el usuario es del sistema nuevo, sus aplicaciones podrían estar en 'applications' (tabla nueva) o 'postulaciones_agiles'
        // Por ahora asumimos que el portal público usa 'postulaciones_agiles'.
        // Pero si el usuario nuevo aplica, ¿dónde se guarda?

        // Revisando PublicJobPortal, usa /api/applications/public (no requiere auth) o similar.
        // Pero para ver "Mis Aplicaciones", usa este endpoint.

        // Vamos a buscar en ambas tablas por seguridad si es sistema nuevo, 
        // pero principalmente mantenemos la lógica legacy para 'postulaciones_agiles'.

        // TODO: Unificar historial de aplicaciones.

        const [applications] = await pool.query(`
            SELECT 
                pa.id,
                pa.estado,
                pa.auto_match_score,
                pa.fecha_postulacion,
                pa.fecha_ultima_actualizacion,
                v.id as vacancy_id,
                v.puesto_nombre,
                v.ubicacion,
                atl.tracking_token
            FROM postulaciones_agiles pa
            INNER JOIN vacantes v ON pa.vacante_id = v.id
            LEFT JOIN application_tracking_links atl ON pa.id = atl.application_id
            WHERE pa.candidato_id = ?
            ORDER BY pa.fecha_postulacion DESC
        `, [candidateId]);

        return applications;
    }

    async getSavedJobs(candidateId, system = 'legacy') {
        if (system === 'new') {
            // TODO: Implementar búsqueda para candidate_accounts
            return [];
        }

        const [savedJobs] = await pool.query(`
            SELECT 
                sj.id,
                sj.vacante_id as vacancy_id,
                sj.fecha_guardado,
                v.puesto_nombre,
                v.descripcion,
                v.ubicacion,
                v.salario_min,
                v.salario_max,
                v.modalidad_trabajo
            FROM candidate_saved_jobs sj
            INNER JOIN vacantes v ON sj.vacante_id = v.id
            WHERE sj.candidato_id = ?
            ORDER BY sj.fecha_guardado DESC
        `, [candidateId]);

        return savedJobs;
    }

    async saveJob(candidateId, vacancyId, system = 'legacy') {
        if (system === 'new') return; // Not supported yet

        // Check if already saved
        const [existing] = await pool.query(
            'SELECT id FROM candidate_saved_jobs WHERE candidato_id = ? AND vacante_id = ?',
            [candidateId, vacancyId]
        );

        if (existing.length > 0) {
            return; // Already saved
        }

        await pool.query(
            'INSERT INTO candidate_saved_jobs (candidato_id, vacante_id, fecha_guardado) VALUES (?, ?, NOW())',
            [candidateId, vacancyId]
        );
    }

    async removeSavedJob(candidateId, vacancyId, system = 'legacy') {
        if (system === 'new') return; // Not supported yet

        await pool.query(
            'DELETE FROM candidate_saved_jobs WHERE candidato_id = ? AND vacante_id = ?',
            [candidateId, vacancyId]
        );
    }
}

module.exports = new CandidateAuthService();
