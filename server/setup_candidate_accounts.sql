-- ===================================
-- 🔐 CANDIDATE ACCOUNTS SYSTEM
-- Sistema completo de cuentas para candidatos
-- Fecha: 2026-02-04
-- ===================================

-- ===================================
-- 1. TABLA: candidate_accounts
-- Cuentas de candidatos registrados
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Autenticación
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    
    -- Recuperación de contraseña
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    
    -- Información personal
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    telefono VARCHAR(50),
    fecha_nacimiento DATE,
    genero ENUM('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'),
    
    -- Información profesional
    titulo_profesional VARCHAR(255),
    experiencia_total_anos INT DEFAULT 0,
    salario_esperado DECIMAL(12,2),
    disponibilidad ENUM('Inmediata', '15 días', '30 días', '2 meses', 'No disponible') DEFAULT 'Inmediata',
    
    -- Links profesionales
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    github_url VARCHAR(500),
    
    -- Documentos
    cv_url TEXT,
    cv_filename VARCHAR(255),
    cv_uploaded_at DATETIME,
    foto_perfil_url TEXT,
    
    -- Preferencias
    permite_notificaciones BOOLEAN DEFAULT TRUE,
    permite_marketing BOOLEAN DEFAULT FALSE,
    busqueda_activa BOOLEAN DEFAULT TRUE,
    
    -- Ubicación
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    
    -- Estado de la cuenta
    estado ENUM('Activa', 'Inactiva', 'Suspendida', 'Eliminada') DEFAULT 'Activa',
    ultima_actividad DATETIME,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_busqueda_activa (busqueda_activa),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 2. TABLA: candidate_skills
-- Habilidades de candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    habilidad VARCHAR(100) NOT NULL,
    nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Experto') DEFAULT 'Intermedio',
    anos_experiencia INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_habilidad (habilidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 3. TABLA: candidate_education
-- Educación de candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    institucion VARCHAR(255) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    nivel_educativo ENUM('Bachillerato', 'Técnico', 'Tecnólogo', 'Pregrado', 'Especialización', 'Maestría', 'Doctorado') NOT NULL,
    area_estudio VARCHAR(255),
    
    fecha_inicio DATE,
    fecha_fin DATE,
    en_curso BOOLEAN DEFAULT FALSE,
    
    descripcion TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_nivel (nivel_educativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 4. TABLA: candidate_experience
-- Experiencia laboral de candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    tipo_empleo ENUM('Tiempo Completo', 'Medio Tiempo', 'Contrato', 'Freelance', 'Pasantía') DEFAULT 'Tiempo Completo',
    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    trabajo_actual BOOLEAN DEFAULT FALSE,
    
    descripcion TEXT,
    logros TEXT,
    
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_trabajo_actual (trabajo_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 5. TABLA: candidate_languages
-- Idiomas de candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    idioma VARCHAR(50) NOT NULL,
    nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Nativo') DEFAULT 'Intermedio',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 6. ACTUALIZAR TABLA: applications
-- Vincular con candidate_accounts
-- ===================================
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS candidate_account_id INT NULL AFTER candidato_id,
ADD COLUMN IF NOT EXISTS application_source ENUM('Portal Anónimo', 'Portal Cuenta', 'Admin', 'LinkedIn', 'Referido') DEFAULT 'Portal Anónimo',
ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(255) UNIQUE COMMENT 'Token para seguimiento sin login',
ADD INDEX idx_candidate_account (candidate_account_id),
ADD INDEX idx_tracking_token (tracking_token);

-- Si existe foreign key previa, intentar agregarla
ALTER TABLE applications
ADD CONSTRAINT fk_applications_candidate_account
FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE SET NULL;

-- ===================================
-- 7. TABLA: candidate_activity_log
-- Log de actividad de candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 8. TABLA: candidate_saved_jobs
-- Vacantes guardadas por candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    vacante_id INT NOT NULL,
    
    notas TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_save (candidate_account_id, vacante_id),
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_vacante (vacante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 9. TABLA: candidate_notifications
-- Notificaciones para candidatos
-- ===================================
CREATE TABLE IF NOT EXISTS candidate_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    
    tipo VARCHAR(50) NOT NULL COMMENT 'application_status, new_message, job_match, etc',
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida DATETIME,
    
    link_accion VARCHAR(500),
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_leida (leida),
    INDEX idx_tipo (tipo),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 10. VISTA: candidate_profile_completeness
-- Calcular completitud del perfil
-- ===================================
CREATE OR REPLACE VIEW candidate_profile_completeness AS
SELECT 
    ca.id,
    ca.email,
    ca.nombre,
    
    -- Calcular porcentaje de completitud
    (
        (CASE WHEN ca.email IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN ca.nombre IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN ca.telefono IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN ca.cv_url IS NOT NULL THEN 15 ELSE 0 END) +
        (CASE WHEN ca.titulo_profesional IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN ca.experiencia_total_anos > 0 THEN 10 ELSE 0 END) +
        (CASE WHEN ca.ciudad IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN ca.foto_perfil_url IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN ca.linkedin_url IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN EXISTS(SELECT 1 FROM candidate_skills WHERE candidate_account_id = ca.id LIMIT 1) THEN 10 ELSE 0 END) +
        (CASE WHEN EXISTS(SELECT 1 FROM candidate_education WHERE candidate_account_id = ca.id LIMIT 1) THEN 15 ELSE 0 END) +
        (CASE WHEN EXISTS(SELECT 1 FROM candidate_experience WHERE candidate_account_id = ca.id LIMIT 1) THEN 10 ELSE 0 END)
    ) AS profile_completeness_percentage,
    
    -- Contar elementos
    (SELECT COUNT(*) FROM candidate_skills WHERE candidate_account_id = ca.id) AS skills_count,
    (SELECT COUNT(*) FROM candidate_education WHERE candidate_account_id = ca.id) AS education_count,
    (SELECT COUNT(*) FROM candidate_experience WHERE candidate_account_id = ca.id) AS experience_count,
    (SELECT COUNT(*) FROM applications WHERE candidate_account_id = ca.id) AS applications_count,
    
    ca.created_at,
    ca.ultima_actividad
    
FROM candidate_accounts ca
WHERE ca.estado = 'Activa';

-- ===================================
-- 11. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ===================================
ALTER TABLE candidate_accounts ADD FULLTEXT INDEX ft_nombre (nombre, apellido, titulo_profesional);

-- ===================================
-- 12. DATOS DE EJEMPLO (OPCIONAL)
-- ===================================
-- Candidato de prueba (password: Test123!)
INSERT IGNORE INTO candidate_accounts (
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono, 
    titulo_profesional, 
    experiencia_total_anos,
    salario_esperado,
    email_verified,
    ciudad,
    departamento
) VALUES (
    'candidato.test@gmail.com',
    '$2b$10$YourHashedPasswordHere', -- Deberás generar esto con bcrypt
    'Juan',
    'Pérez García',
    '+57 300 123 4567',
    'Ingeniero de Sistemas',
    5,
    4500000,
    TRUE,
    'Bogotá',
    'Cundinamarca'
);

-- ===================================
-- ✅ SCHEMA COMPLETO INSTALADO
-- ===================================
SELECT '✅ Candidate Accounts System - Schema instalado correctamente' AS status;
