-- ========================================================
-- SISTEMA DE GESTIÓN DE TALENTO - GH-SCORE PRO V3
-- Schema Completo para Producción
-- ========================================================

CREATE DATABASE IF NOT EXISTS sistema_gestion_talento;
USE sistema_gestion_talento;

-- 1. ESTRUCTURA SAAS (TENANTS, ROLES, USERS)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    tax_id VARCHAR(50),
    status ENUM('active', 'suspended', 'archived') DEFAULT 'active',
    config_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id CHAR(36) NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_per_tenant (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    category VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    avatar_url VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CATÁLOGOS Y MAESTRAS
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS sedes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) DEFAULT 'Cartagena'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS procesos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. GESTIÓN DE VACANTES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS vacantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo_requisicion VARCHAR(50) UNIQUE,
    puesto_nombre VARCHAR(150) NOT NULL,
    proceso_id INT,
    sede_id INT,
    fecha_apertura DATE,
    fecha_cierre_estimada DATE,
    fecha_cierre_real DATE,
    estado ENUM('Abierta', 'En Proceso', 'Cubierta', 'Cancelada', 'Suspendida') DEFAULT 'Abierta',
    prioridad ENUM('Baja', 'Media', 'Alta', 'Crítica'),
    responsable_rh VARCHAR(100),
    presupuesto_aprobado DECIMAL(12,2) DEFAULT 0,
    salario_base_ofrecido DECIMAL(12,2) DEFAULT 0,
    costo_vacante DECIMAL(12,2) DEFAULT 0,
    dias_sla_meta INT DEFAULT 15,
    descripcion TEXT,
    requisitos TEXT,
    beneficios TEXT,
    tipo_trabajo ENUM('Tiempo Completo', 'Medio Tiempo', 'Contrato', 'Freelance', 'Pasantía') DEFAULT 'Tiempo Completo',
    modalidad_trabajo ENUM('Presencial', 'Remoto', 'Híbrido') DEFAULT 'Presencial',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proceso_id) REFERENCES procesos(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. GESTIÓN DE CANDIDATOS Y PORTAL
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS candidatos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    password_hash VARCHAR(255), -- Para el portal de candidatos
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    titulo_profesional VARCHAR(255),
    experiencia_anos INT DEFAULT 0,
    cv_url VARCHAR(500),
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    ultimo_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    habilidad VARCHAR(100) NOT NULL,
    nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Experto') DEFAULT 'Intermedio',
    anos_experiencia INT DEFAULT 0,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    fecha_guardado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_save (candidato_id, vacante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. POSTULACIONES Y SEGUIMIENTO (TRACKING)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS postulaciones_agiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vacante_id INT NOT NULL,
    candidato_id INT NOT NULL,
    estado ENUM('Nueva', 'En Revisión', 'Preseleccionado', 'Entrevista', 'Oferta', 'Contratado', 'Rechazado', 'En Reserva') DEFAULT 'Nueva',
    auto_match_score INT DEFAULT 0,
    carta_presentacion TEXT,
    fuente_reclutamiento VARCHAR(100) DEFAULT 'Portal Directo',
    fecha_postulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    INDEX idx_estado (estado),
    INDEX idx_match (auto_match_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS application_tracking_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    tracking_token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    views_count INT DEFAULT 0,
    last_viewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES postulaciones_agiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. INTELIGENCIA Y AUTOMATIZACIÓN (AGENTS & REFERRALS)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    status ENUM('success', 'failed', 'warning', 'info') DEFAULT 'info',
    details TEXT,
    entity_type VARCHAR(50), -- 'vacancy', 'candidate', etc.
    entity_id INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS referidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_name VARCHAR(150) NOT NULL,
    referrer_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(150) NOT NULL,
    candidate_contact VARCHAR(255) NOT NULL,
    vacancy_id INT,
    status ENUM('Pending', 'In Evaluation', 'Hired', 'Rejected') DEFAULT 'Pending',
    recruiter_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vacancy_id) REFERENCES vacantes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. NOTIFICACIONES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- Referencia a tabla users (admin)
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS candidate_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    mensaje TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- DATA SEMILLA (OPTIONAL)
-- ========================================================

-- Initial Tenant
INSERT IGNORE INTO tenants (id, name, subdomain, status) VALUES 
('11111111-1111-1111-1111-111111111111', 'DISCOL SAS', 'discol', 'active');

-- Master Data
INSERT IGNORE INTO sedes (id, nombre, ciudad) VALUES (1, 'Sede Principal', 'Cartagena'), (2, 'Planta Norte', 'Cartagena');
INSERT IGNORE INTO procesos (id, nombre) VALUES (1, 'Administrativo'), (2, 'Operativo'), (3, 'Comercial');

-- Roles
INSERT IGNORE INTO roles (tenant_id, name, description, is_system_role) VALUES 
(NULL, 'Superadmin', 'Platform Owner', TRUE),
('11111111-1111-1111-1111-111111111111', 'Admin', 'Empresa Admin', TRUE);

-- Admin User (Pass: admin123 - hash example)
INSERT IGNORE INTO users (tenant_id, email, password_hash, full_name, role_id) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@discol.com', '$2b$10$7R.D0vS0kXf9z5j/C5zFO.rUeXwK5o0mI5b2p3Q8X8z8z8z8z8z8', 'Administrador Sistema', 2);

-- 8. AI SOURCING TABLES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS sourcing_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vacante_id INT,
    nombre VARCHAR(255) NOT NULL,
    estado ENUM('active', 'paused', 'completed') DEFAULT 'active',
    fuentes_activas JSON,
    filtros JSON,
    candidatos_encontrados INT DEFAULT 0,
    candidatos_contactados INT DEFAULT 0,
    tasa_respuesta DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_ejecucion TIMESTAMP NULL,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    INDEX idx_estado (estado),
    INDEX idx_vacante (vacante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sourced_candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    fuente ENUM('linkedin', 'indeed', 'computrabajo', 'elempleo', 'magneto', 'other') NOT NULL,
    perfil_url TEXT,
    cv_text TEXT,
    ai_match_score DECIMAL(5,2) DEFAULT 0,
    ai_analysis JSON,
    estado ENUM('new', 'contacted', 'responded', 'interviewing', 'rejected', 'hired') DEFAULT 'new',
    fecha_descubrimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_contacto TIMESTAMP NULL,
    notas TEXT,
    FOREIGN KEY (campaign_id) REFERENCES sourcing_campaigns(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_campaign (email, campaign_id),
    INDEX idx_score (ai_match_score),
    INDEX idx_estado (estado),
    INDEX idx_fuente (fuente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_board_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 5,
    rate_limit_ms INT DEFAULT 1000,
    last_used TIMESTAMP NULL,
    total_candidates_found INT DEFAULT 0,
    avg_match_score DECIMAL(5,2) DEFAULT 0,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO job_board_sources (nombre, enabled, priority, rate_limit_ms, config) VALUES
('LinkedIn', TRUE, 1, 2000, '{"api_key": null, "scraping_enabled": true}'),
('Indeed', TRUE, 2, 1500, '{"api_key": null, "scraping_enabled": true}'),
('Computrabajo', TRUE, 3, 1000, '{"region": "CO", "scraping_enabled": true}'),
('ElEmpleo', TRUE, 4, 1000, '{"region": "CO", "scraping_enabled": true}'),
('Magneto365', TRUE, 5, 1200, '{"region": "LATAM", "scraping_enabled": true}');

SELECT '✅ Base de datos configurada al 100% con V3.0 + Sourcing AI' as status;
