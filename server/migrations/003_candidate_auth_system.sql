-- ============================================
-- MIGRACIÓN 003: Sistema de Autenticación para Candidatos
-- ============================================
-- Fecha: 2026-02-03
-- Descripción: Implementa login opcional para candidatos externos
--              con tracking mejorado de postulaciones

-- 1. Agregar campos de autenticación a external_candidates
ALTER TABLE external_candidates
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Contraseña hasheada (opcional)',
ADD COLUMN IF NOT EXISTS has_account BOOLEAN DEFAULT FALSE COMMENT 'Indica si tiene cuenta creada',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE COMMENT 'Email verificado',
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL COMMENT 'Token de verificación de email',
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL COMMENT 'Token para resetear contraseña',
ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL COMMENT 'Expiración del token de reset',
ADD COLUMN IF NOT EXISTS last_login DATETIME NULL COMMENT 'Último inicio de sesión',
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE COMMENT 'Perfil completo';

-- 2. Tabla para tracking de links mágicos
CREATE TABLE IF NOT EXISTS application_tracking_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    tracking_token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    views_count INT DEFAULT 0,
    last_viewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_tracking_token (tracking_token),
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Links mágicos para tracking de postulaciones sin login';

-- 3. Tabla para notificaciones de candidatos
CREATE TABLE IF NOT EXISTS candidate_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_candidate_id INT NOT NULL,
    application_id INT NULL,
    tipo VARCHAR(50) NOT NULL COMMENT 'nueva_respuesta, cambio_estado, entrevista_agendada, etc',
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    action_url VARCHAR(500) NULL COMMENT 'URL para acción relacionada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (external_candidate_id) REFERENCES external_candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    INDEX idx_candidate (external_candidate_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notificaciones para candidatos (con y sin cuenta)';

-- 4. Tabla para documentos adicionales de candidatos
CREATE TABLE IF NOT EXISTS candidate_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_candidate_id INT NOT NULL,
    application_id INT NULL COMMENT 'Si es específico para una postulación',
    document_type VARCHAR(50) NOT NULL COMMENT 'cv, certificate, portfolio, cover_letter, etc',
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NULL COMMENT 'Tamaño en bytes',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (external_candidate_id) REFERENCES external_candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_candidate (external_candidate_id),
    INDEX idx_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documentos cargados por candidatos';

-- 5. Tabla para habilidades de candidatos
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_candidate_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'Intermedio' COMMENT 'Básico, Intermedio, Avanzado, Experto',
    years_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (external_candidate_id) REFERENCES external_candidates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_candidate_skill (external_candidate_id, skill_name),
    INDEX idx_skill (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Habilidades de candidatos para mejor matching';

-- 6. Tabla para idiomas de candidatos
CREATE TABLE IF NOT EXISTS candidate_languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_candidate_id INT NOT NULL,
    language_name VARCHAR(50) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'Intermedio' COMMENT 'Básico, Intermedio, Avanzado, Nativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (external_candidate_id) REFERENCES external_candidates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_candidate_language (external_candidate_id, language_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Idiomas que habla el candidato';

-- 7. Mejorar tabla external_candidates con campos adicionales
ALTER TABLE external_candidates
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) NULL COMMENT 'Ciudad de residencia',
ADD COLUMN IF NOT EXISTS direccion TEXT NULL COMMENT 'Dirección completa',
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE NULL COMMENT 'Fecha de nacimiento',
ADD COLUMN IF NOT EXISTS genero VARCHAR(20) NULL COMMENT 'Género',
ADD COLUMN IF NOT EXISTS nivel_estudios VARCHAR(100) NULL COMMENT 'Máximo nivel de estudios',
ADD COLUMN IF NOT EXISTS universidad VARCHAR(255) NULL COMMENT 'Universidad o institución',
ADD COLUMN IF NOT EXISTS carrera VARCHAR(255) NULL COMMENT 'Carrera estudiada',
ADD COLUMN IF NOT EXISTS biografia TEXT NULL COMMENT 'Biografía profesional',
ADD COLUMN IF NOT EXISTS portafolio_url VARCHAR(500) NULL COMMENT 'URL del portafolio',
ADD COLUMN IF NOT EXISTS github_url VARCHAR(500) NULL COMMENT 'Perfil de GitHub',
ADD COLUMN IF NOT EXISTS behance_url VARCHAR(500) NULL COMMENT 'Perfil de Behance',
ADD COLUMN IF NOT EXISTS disponibilidad_viajar BOOLEAN DEFAULT FALSE COMMENT 'Disponible para viajar',
ADD COLUMN IF NOT EXISTS disponibilidad_cambio_residencia BOOLEAN DEFAULT FALSE COMMENT 'Disponible para mudarse',
ADD COLUMN IF NOT EXISTS preferencia_modalidad VARCHAR(50) NULL COMMENT 'Presencial, Remoto, Híbrido';

-- 8. Agregar campos para tracking en applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS tracking_link_sent BOOLEAN DEFAULT FALSE COMMENT 'Link de tracking enviado por email',
ADD COLUMN IF NOT EXISTS candidate_viewed_at DATETIME NULL COMMENT 'Última vez que el candidato vio la postulación',
ADD COLUMN IF NOT EXISTS candidate_notes TEXT NULL COMMENT 'Notas del candidato sobre su postulación',
ADD COLUMN IF NOT EXISTS rating_by_candidate INT NULL COMMENT 'Calificación de la experiencia (1-5)',
ADD COLUMN IF NOT EXISTS feedback_by_candidate TEXT NULL COMMENT 'Feedback del candidato sobre el proceso';

-- 9. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_external_candidates_has_account ON external_candidates(has_account);
CREATE INDEX IF NOT EXISTS idx_external_candidates_email_verified ON external_candidates(email_verified);
CREATE INDEX IF NOT EXISTS idx_external_candidates_ciudad ON external_candidates(ciudad);
CREATE INDEX IF NOT EXISTS idx_applications_tracking ON applications(email, estado, fecha_postulacion);

-- 10. Crear vista para candidatos con cuenta
CREATE OR REPLACE VIEW candidate_accounts AS
SELECT 
    ec.id,
    ec.nombre,
    ec.email,
    ec.telefono,
    ec.titulo_profesional,
    ec.experiencia_total_anos,
    ec.ciudad,
    ec.nivel_estudios,
    ec.has_account,
    ec.email_verified,
    ec.profile_completed,
    ec.last_login,
    ec.created_at,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.estado = 'Entrevista' THEN a.id END) as interviews_count,
    COUNT(DISTINCT CASE WHEN a.estado = 'Contratado' THEN a.id END) as hired_count,
    MAX(a.fecha_postulacion) as last_application_date
FROM external_candidates ec
LEFT JOIN applications a ON a.email = ec.email
WHERE ec.has_account = TRUE
GROUP BY ec.id;

-- 11. Trigger para actualizar profile_completed
DELIMITER $$

DROP TRIGGER IF EXISTS update_profile_completed$$
CREATE TRIGGER update_profile_completed
BEFORE UPDATE ON external_candidates
FOR EACH ROW
BEGIN
    -- Verificar si el perfil está completo
    IF NEW.has_account = TRUE THEN
        SET NEW.profile_completed = (
            NEW.nombre IS NOT NULL AND NEW.nombre != '' AND
            NEW.email IS NOT NULL AND NEW.email != '' AND
            NEW.telefono IS NOT NULL AND NEW.telefono != '' AND
            NEW.titulo_profesional IS NOT NULL AND NEW.titulo_profesional != '' AND
            NEW.experiencia_total_anos IS NOT NULL AND
            NEW.ciudad IS NOT NULL AND NEW.ciudad != '' AND
            NEW.cv_url IS NOT NULL AND NEW.cv_url != ''
        );
    END IF;
END$$

DELIMITER ;

-- ============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ============================================

-- Insertar un candidato de ejemplo con cuenta
INSERT INTO external_candidates (
    nombre, email, telefono, titulo_profesional, 
    experiencia_total_anos, ciudad, fuente, 
    has_account, email_verified, password_hash,
    nivel_estudios, biografia, profile_completed
) VALUES (
    'María Test Candidate',
    'maria.test@example.com',
    '+57 300 111 2222',
    'Desarrolladora Full Stack',
    4,
    'Bogotá',
    'Portal DISCOL',
    TRUE,
    TRUE,
    '$2b$10$example_hashed_password',
    'Profesional - Ingeniería de Sistemas',
    'Desarrolladora con 4 años de experiencia en React, Node.js y bases de datos SQL.',
    TRUE
) ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Migración 003 completada exitosamente' as status;
SELECT COUNT(*) as candidatos_con_cuenta FROM external_candidates WHERE has_account = TRUE;
SELECT COUNT(*) as total_notificaciones FROM candidate_notifications;
SELECT COUNT(*) as total_tracking_links FROM application_tracking_links;
