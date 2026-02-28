-- ===================================
-- 🔧 SCHEMA SIMPLIFICADO - CANDIDATE ACCOUNTS
-- Versión segura que no falla si ya existe
-- ===================================

-- 1. Tabla de cuentas de candidatos
CREATE TABLE IF NOT EXISTS candidate_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    telefono VARCHAR(50),
    fecha_nacimiento DATE,
    genero ENUM('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'),
    titulo_profesional VARCHAR(255),
    experiencia_total_anos INT DEFAULT 0,
    salario_esperado DECIMAL(12,2),
    disponibilidad ENUM('Inmediata', '15 días', '30 días', '2 meses', 'No disponible') DEFAULT 'Inmediata',
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    github_url VARCHAR(500),
    cv_url TEXT,
    cv_filename VARCHAR(255),
    cv_uploaded_at DATETIME,
    foto_perfil_url TEXT,
    permite_notificaciones BOOLEAN DEFAULT TRUE,
    permite_marketing BOOLEAN DEFAULT FALSE,
    busqueda_activa BOOLEAN DEFAULT TRUE,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    estado ENUM('Activa', 'Inactiva', 'Suspendida', 'Eliminada') DEFAULT 'Activa',
    ultima_actividad DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Habilidades
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    habilidad VARCHAR(100) NOT NULL,
    nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Experto') DEFAULT 'Intermedio',
    anos_experiencia INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Educación
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
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Experiencia
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
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Idiomas
CREATE TABLE IF NOT EXISTS candidate_languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    idioma VARCHAR(50) NOT NULL,
    nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Nativo') DEFAULT 'Intermedio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Log de actividad
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
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Vacantes guardadas
CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    vacante_id INT NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_save (candidate_account_id, vacante_id),
    INDEX idx_candidate (candidate_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Notificaciones
CREATE TABLE IF NOT EXISTS candidate_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_account_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida DATETIME,
    link_accion VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Tablas de candidatos creadas exitosamente' AS resultado;
