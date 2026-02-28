const pool = require('../db');
const {
    hashPassword,
    verifyPassword,
    generateToken,
    generateEmailVerificationToken,
    generateResetToken,
    generateExpirationDate,
    validatePassword,
    validateEmail,
    sanitizeName
} = require('../utils/candidateAuth');

/**
 * ===================================
 * 🎯 CANDIDATE ACCOUNT SERVICE
 * Lógica de negocio para candidatos
 * ===================================
 */

class CandidateAccountService {

    /**
     * Registrar nuevo candidato
     */
    async register(candidateData) {
        const { email, password, nombre, apellido, telefono } = candidateData;

        try {
            // 1. Validar datos
            if (!email || !password || !nombre) {
                throw new Error('Email, contraseña y nombre son obligatorios');
            }

            if (!validateEmail(email)) {
                throw new Error('El formato del email no es válido');
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }

            // 2. Verificar que el email no exista
            const [existing] = await pool.query(
                'SELECT id FROM candidate_accounts WHERE email = ?',
                [email.toLowerCase().trim()]
            );

            if (existing.length > 0) {
                throw new Error('Este email ya está registrado');
            }

            // 3. Hash de contraseña
            const passwordHash = await hashPassword(password);

            // 4. Generar token de verificación
            const verificationToken = generateEmailVerificationToken();
            const verificationExpires = generateExpirationDate(48); // 48 horas para verificar

            // 5. Crear candidato
            const [result] = await pool.query(
                `INSERT INTO candidate_accounts (
                    email, 
                    password_hash, 
                    nombre, 
                    apellido, 
                    telefono,
                    email_verification_token,
                    email_verification_expires,
                    ultima_actividad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    email.toLowerCase().trim(),
                    passwordHash,
                    sanitizeName(nombre),
                    sanitizeName(apellido) || null,
                    telefono || null,
                    verificationToken,
                    verificationExpires
                ]
            );

            const candidateId = result.insertId;

            // 6. Log de actividad
            await this.logActivity(candidateId, 'register', 'Cuenta creada exitosamente');

            // 7. Generar token JWT
            const token = generateToken({
                id: candidateId,
                email: email.toLowerCase().trim(),
                nombre: sanitizeName(nombre)
            });

            console.log(`✅ Candidato registrado: ${email} (ID: ${candidateId})`);

            return {
                success: true,
                message: 'Cuenta creada exitosamente. Por favor verifica tu email.',
                candidate: {
                    id: candidateId,
                    email: email.toLowerCase().trim(),
                    nombre: sanitizeName(nombre),
                    apellido: sanitizeName(apellido) || null
                },
                token,
                verificationToken, // Lo necesitaremos para enviar email
                requiresEmailVerification: true
            };

        } catch (error) {
            console.error('❌ Error en register:', error);
            throw error;
        }
    }

    /**
     * Login de candidato
     */
    async login(email, password) {
        try {
            // 1. Validar datos
            if (!email || !password) {
                throw new Error('Email y contraseña son obligatorios');
            }

            // 2. Buscar candidato
            const [candidates] = await pool.query(
                `SELECT 
                    id, 
                    email, 
                    password_hash, 
                    nombre, 
                    apellido, 
                    estado,
                    email_verified,
                    foto_perfil_url
                FROM candidate_accounts 
                WHERE email = ?`,
                [email.toLowerCase().trim()]
            );

            if (candidates.length === 0) {
                throw new Error('Email o contraseña incorrectos');
            }

            const candidate = candidates[0];

            // 3. Verificar estado de la cuenta
            if (candidate.estado !== 'Activa') {
                throw new Error(`Tu cuenta está ${candidate.estado.toLowerCase()}. Contacta al soporte.`);
            }

            // 4. Verificar contraseña
            const passwordMatch = await verifyPassword(password, candidate.password_hash);

            if (!passwordMatch) {
                // Log intento fallido
                await this.logActivity(candidate.id, 'login_failed', 'Intento de login con contraseña incorrecta');
                throw new Error('Email o contraseña incorrectos');
            }

            // 5. Actualizar última actividad
            await pool.query(
                'UPDATE candidate_accounts SET ultima_actividad = NOW() WHERE id = ?',
                [candidate.id]
            );

            // 6. Log de actividad
            await this.logActivity(candidate.id, 'login', 'Login exitoso');

            // 7. Generar token
            const token = generateToken({
                id: candidate.id,
                email: candidate.email,
                nombre: candidate.nombre
            });

            console.log(`✅ Candidato logueado: ${email} (ID: ${candidate.id})`);

            return {
                success: true,
                message: 'Login exitoso',
                candidate: {
                    id: candidate.id,
                    email: candidate.email,
                    nombre: candidate.nombre,
                    apellido: candidate.apellido,
                    emailVerified: candidate.email_verified,
                    fotoPerfil: candidate.foto_perfil_url
                },
                token
            };

        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    /**
     * Verificar email
     */
    async verifyEmail(token) {
        try {
            const [candidates] = await pool.query(
                `SELECT id, email, nombre 
                FROM candidate_accounts 
                WHERE email_verification_token = ? 
                AND email_verification_expires > NOW()
                AND email_verified = FALSE`,
                [token]
            );

            if (candidates.length === 0) {
                throw new Error('Token de verificación inválido o expirado');
            }

            const candidate = candidates[0];

            // Marcar email como verificado
            await pool.query(
                `UPDATE candidate_accounts 
                SET email_verified = TRUE, 
                    email_verification_token = NULL, 
                    email_verification_expires = NULL 
                WHERE id = ?`,
                [candidate.id]
            );

            await this.logActivity(candidate.id, 'email_verified', 'Email verificado exitosamente');

            console.log(`✅ Email verificado: ${candidate.email}`);

            return {
                success: true,
                message: 'Email verificado exitosamente',
                candidate: {
                    id: candidate.id,
                    email: candidate.email,
                    nombre: candidate.nombre
                }
            };

        } catch (error) {
            console.error('❌ Error en verifyEmail:', error);
            throw error;
        }
    }

    /**
     * Reenviar email de verificación
     */
    async resendVerificationEmail(email) {
        try {
            const [candidates] = await pool.query(
                'SELECT id, email, nombre, email_verified FROM candidate_accounts WHERE email = ?',
                [email.toLowerCase().trim()]
            );

            if (candidates.length === 0) {
                throw new Error('Email no encontrado');
            }

            const candidate = candidates[0];

            if (candidate.email_verified) {
                throw new Error('Este email ya está verificado');
            }

            // Generar nuevo token
            const verificationToken = generateEmailVerificationToken();
            const verificationExpires = generateExpirationDate(48);

            await pool.query(
                `UPDATE candidate_accounts 
                SET email_verification_token = ?, 
                    email_verification_expires = ? 
                WHERE id = ?`,
                [verificationToken, verificationExpires, candidate.id]
            );

            return {
                success: true,
                message: 'Email de verificación reenviado',
                verificationToken
            };

        } catch (error) {
            console.error('❌ Error en resendVerificationEmail:', error);
            throw error;
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    async requestPasswordReset(email) {
        try {
            const [candidates] = await pool.query(
                'SELECT id, email, nombre FROM candidate_accounts WHERE email = ? AND estado = "Activa"',
                [email.toLowerCase().trim()]
            );

            if (candidates.length === 0) {
                // Por seguridad, no revelar si el email existe
                return {
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
                };
            }

            const candidate = candidates[0];

            // Generar token de reset
            const resetToken = generateResetToken();
            const resetExpires = generateExpirationDate(2); // 2 horas

            await pool.query(
                `UPDATE candidate_accounts 
                SET reset_token = ?, 
                    reset_token_expires = ? 
                WHERE id = ?`,
                [resetToken, resetExpires, candidate.id]
            );

            await this.logActivity(candidate.id, 'password_reset_requested', 'Solicitud de recuperación de contraseña');

            console.log(`🔑 Reset token generado para: ${email}`);

            return {
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
                resetToken, // Para enviar por email
                candidateEmail: email,
                candidateNombre: candidate.nombre
            };

        } catch (error) {
            console.error('❌ Error en requestPasswordReset:', error);
            throw error;
        }
    }

    /**
     * Resetear contraseña
     */
    async resetPassword(token, newPassword) {
        try {
            // Validar nueva contraseña
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }

            const [candidates] = await pool.query(
                `SELECT id, email 
                FROM candidate_accounts 
                WHERE reset_token = ? 
                AND reset_token_expires > NOW()`,
                [token]
            );

            if (candidates.length === 0) {
                throw new Error('Token de recuperación inválido o expirado');
            }

            const candidate = candidates[0];

            // Hash nueva contraseña
            const passwordHash = await hashPassword(newPassword);

            // Actualizar contraseña y limpiar tokens
            await pool.query(
                `UPDATE candidate_accounts 
                SET password_hash = ?, 
                    reset_token = NULL, 
                    reset_token_expires = NULL 
                WHERE id = ?`,
                [passwordHash, candidate.id]
            );

            await this.logActivity(candidate.id, 'password_reset', 'Contraseña restablecida exitosamente');

            console.log(`✅ Contraseña restablecida para: ${candidate.email}`);

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };

        } catch (error) {
            console.error('❌ Error en resetPassword:', error);
            throw error;
        }
    }

    /**
     * Obtener perfil del candidato
     */
    async getProfile(candidateId) {
        try {
            const [candidates] = await pool.query(
                `SELECT 
                    id, email, nombre, apellido, telefono, fecha_nacimiento, genero,
                    titulo_profesional, experiencia_total_anos, salario_esperado, disponibilidad,
                    linkedin_url, portfolio_url, github_url,
                    cv_url, cv_filename, cv_uploaded_at, foto_perfil_url,
                    permite_notificaciones, permite_marketing, busqueda_activa,
                    ciudad, departamento, pais,
                    email_verified, estado, ultima_actividad, created_at
                FROM candidate_accounts 
                WHERE id = ?`,
                [candidateId]
            );

            if (candidates.length === 0) {
                throw new Error('Candidato no encontrado');
            }

            const candidate = candidates[0];

            // Cargar datos relacionados
            const [skills] = await pool.query(
                'SELECT habilidad, nivel, anos_experiencia FROM candidate_skills WHERE candidate_account_id = ?',
                [candidateId]
            );

            const [education] = await pool.query(
                `SELECT id, institucion, titulo, nivel_educativo, area_estudio, 
                fecha_inicio, fecha_fin, en_curso, descripcion 
                FROM candidate_education 
                WHERE candidate_account_id = ? 
                ORDER BY fecha_inicio DESC`,
                [candidateId]
            );

            const [experience] = await pool.query(
                `SELECT id, empresa, cargo, tipo_empleo, fecha_inicio, fecha_fin, 
                trabajo_actual, descripcion, logros, ciudad, pais 
                FROM candidate_experience 
                WHERE candidate_account_id = ? 
                ORDER BY fecha_inicio DESC`,
                [candidateId]
            );

            const [languages] = await pool.query(
                'SELECT idioma, nivel FROM candidate_languages WHERE candidate_account_id = ?',
                [candidateId]
            );

            // Calcular completit ud del perfil manualmente
            let completeness = 0;
            completeness += candidate.email ? 5 : 0;
            completeness += candidate.nombre ? 5 : 0;
            completeness += candidate.telefono ? 5 : 0;
            completeness += candidate.cv_url ? 15 : 0;
            completeness += candidate.titulo_profesional ? 10 : 0;
            completeness += candidate.experiencia_total_anos > 0 ? 10 : 0;
            completeness += candidate.ciudad ? 5 : 0;
            completeness += candidate.foto_perfil_url ? 5 : 0;
            completeness += candidate.linkedin_url ? 5 : 0;
            completeness += skills.length > 0 ? 10 : 0;
            completeness += education.length > 0 ? 15 : 0;
            completeness += experience.length > 0 ? 10 : 0;

            return {
                ...candidate,
                skills,
                education,
                experience,
                languages,
                profileCompleteness: completeness
            };

        } catch (error) {
            console.error('❌ Error en getProfile:', error);
            throw error;
        }
    }

    /**
     * Actualizar perfil
     */
    async updateProfile(candidateId, updates) {
        try {
            const allowedFields = [
                'nombre', 'apellido', 'telefono', 'fecha_nacimiento', 'genero',
                'titulo_profesional', 'experiencia_total_anos', 'salario_esperado', 'disponibilidad',
                'linkedin_url', 'portfolio_url', 'github_url',
                'ciudad', 'departamento', 'pais',
                'permite_notificaciones', 'permite_marketing', 'busqueda_activa'
            ];

            const updateFields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            values.push(candidateId);

            await pool.query(
                `UPDATE candidate_accounts SET ${updateFields.join(', ')} WHERE id = ?`,
                values
            );

            await this.logActivity(candidateId, 'profile_updated', 'Perfil actualizado');

            console.log(`✅ Perfil actualizado para candidato ID: ${candidateId}`);

            return {
                success: true,
                message: 'Perfil actualizado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error en updateProfile:', error);
            throw error;
        }
    }

    /**
     * Registrar actividad del candidato
     */
    async logActivity(candidateId, accion, descripcion, req = null) {
        try {
            const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
            const userAgent = req ? req.headers['user-agent'] : null;

            await pool.query(
                `INSERT INTO candidate_activity_log (candidate_account_id, accion, descripcion, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)`,
                [candidateId, accion, descripcion, ipAddress, userAgent]
            );
        } catch (error) {
            // No fallar si el log falla
            console.error('⚠️  Error logging activity:', error);
        }
    }
}

module.exports = new CandidateAccountService();
