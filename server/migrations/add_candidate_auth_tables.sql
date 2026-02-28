-- ===============================================
-- MIGRACIÓN CORREGIDA: Sistema de Autenticación de Candidatos
-- Fecha: 2026-02-03
-- Descripción: Crea tabla de candidatos (usuarios) y tablas relacionadas
-- ===============================================

-- 1. Crear tabla de Candidatos (Usuarios)
CREATE TABLE IF NOT EXISTS candidatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    ciudad VARCHAR(100),
    titulo_profesional VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    cv_url VARCHAR(512),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de vacantes guardadas por candidatos
CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    fecha_guardado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_job (candidato_id, vacante_id),
    INDEX idx_saved_candidato (candidato_id),
    INDEX idx_saved_vacante (vacante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de notificaciones para candidatos
CREATE TABLE IF NOT EXISTS candidate_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    INDEX idx_notif_candidato (candidato_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Fin de la migración
-- ===============================================
