const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyPassword } = require('../utils/candidateAuth');
const candidateAccountService = require('./candidateAccountService'); // Para delegar operaciones del nuevo sistema

class CandidateAuthService {

    async register(data) {
        // Obtenemos identificacion que viene del signup (ahora es PK)
        const { identificacion, nombre, email, telefono, password, ciudad, titulo_profesional } = data;

        if (!identificacion) {
            throw new Error('La identificación (Cédula) es requerida');
        }

        // Verificar si la identificacion ya existe (Hoja de Vida de ERP)
        const [existing] = await pool.query(
            'SELECT identificacion, password_hash FROM candidatos WHERE identificacion = ?',
            [identificacion]
        );

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

        let linked = false;

        if (existing.length > 0) {
            // Existe en el ERP. Verificamos si ya está vinculado (tiene contraseña)
            if (existing[0].password_hash) {
                throw new Error('Esta identificación ya tiene una cuenta registrada en el portal. Inicia sesión.');
            }
            
            // Si no tiene contraseña, fue importado del ERP -> "Vinculamos" la cuenta
            await pool.query(`
                UPDATE candidatos
                SET 
                    nombre = COALESCE(?, nombre),
                    email = COALESCE(?, email),
                    telefono = COALESCE(?, telefono),
                    password_hash = ?,
                    ciudad = COALESCE(?, ciudad),
                    titulo_profesional = COALESCE(?, titulo_profesional),
                    updated_at = NOW()
                WHERE identificacion = ?
            `, [nombre, email, telefono, hashedPassword, ciudad, titulo_profesional, identificacion]);
            linked = true;
        } else {
            // No existe -> Creación de cero
            await pool.query(`
                INSERT INTO candidatos (
                    identificacion, nombre, email, telefono, password_hash, ciudad, titulo_profesional,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [identificacion, nombre, email, telefono, hashedPassword, ciudad, titulo_profesional]);
        }

        // Generate token
        const token = jwt.sign(
            { id: identificacion, email, type: 'candidate', system: 'legacy' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            linked,
            candidate: {
                id: identificacion,
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
            return [];
        }

        /* 
         * Requerimiento FASE 2: Applications Controller. 
         * LEFT JOIN cuádruple para mostrar al usuario en qué paso va:
         * RP (Requisición), RA (Aspirante), RC (Contratación)
         * - Candidato -> Applications_ERP (RA) -> Vacantes (RP) -> Contracts_ERP (RC)
         * candidatoId ahora es "identificacion" (string)
         */
         
        const [applications] = await pool.query(`
            SELECT 
                ae.idu_ra as application_id,
                ae.resultado_evaluacion,
                ae.experiencia_requerida,
                ae.estado_aspirante as estado_ra,
                ae.fecha_registro as fecha_postulacion,
                
                v.idu_rp as vacancy_id,
                v.puesto_nombre,
                v.estado_erp as estado_rp,
                v.solicitante_nombre,
                
                ce.idu_rc as contract_id,
                ce.estado_vinculacion as estado_rc,
                ce.emo_pdf,
                ce.identificacion_pdf,
                ce.hoja_vida_pdf
                
            FROM applications_erp ae
            LEFT JOIN vacantes v ON ae.idu_rp = v.idu_rp
            LEFT JOIN contracts_erp ce ON ae.idu_ra = ce.idu_ra
            LEFT JOIN candidatos c ON ae.candidato_identificacion = c.identificacion
            WHERE c.identificacion = ?
            ORDER BY ae.fecha_registro DESC
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
