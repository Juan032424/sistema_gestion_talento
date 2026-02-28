-- ===========================================
-- DISCOL TALENT PLATFORM - APPLICATION SYSTEM
-- Portal de Empleo Interno con Auto-Matching
-- ===========================================

-- 1. Tabla de Postulaciones (Applications)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    vacante_id INT NOT NULL,
    candidato_id INT NULL, -- Null si es candidato externo (no registrado)
    
    -- Datos del aplicante (si es externo)
    nombre VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    cv_url VARCHAR(500),
    
    -- Match y scoring
    auto_match_score INT DEFAULT 0, -- Score automático 0-100
    recruiter_rating INT DEFAULT 0, -- Rating manual del reclutador 1-5
    
    -- Estado del proceso
    estado ENUM('Nueva', 'En Revisión', 'Preseleccionado', 'Entrevista', 'Oferta', 'Contratado', 'Rechazado') DEFAULT 'Nueva',
    
    -- Información adicional
    carta_presentacion TEXT,
    experiencia_anos INT,
    salario_esperado DECIMAL(12,2),
    disponibilidad VARCHAR(100),
    
    -- Notas del reclutador
    notas_reclutador TEXT,
    
    -- Tracking
    fecha_postulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    vista_por_reclutador BOOLEAN DEFAULT FALSE,
    fecha_vista DATETIME NULL,
    
    -- Indices
    INDEX idx_vacante (vacante_id),
    INDEX idx_candidato (candidato_id),
    INDEX idx_estado (estado),
    INDEX idx_score (auto_match_score),
    INDEX idx_fecha (fecha_postulacion),
    
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla de Candidatos Externos (Pre-registro)
CREATE TABLE IF NOT EXISTS external_candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    ubicacion VARCHAR(255),
    
    -- Perfil profesional
    titulo_profesional VARCHAR(255),
    experiencia_total_anos INT,
    nivel_educacion VARCHAR(100),
    
    -- Skills y competencias
    habilidades_tecnicas TEXT, -- JSON array
    idiomas TEXT, -- JSON array
    certificaciones TEXT,
    
    -- Preferencias
    areas_interes TEXT, -- JSON array
    tipo_empleo_buscado VARCHAR(100), -- Tiempo completo, medio tiempo, etc.
    disponibilidad_viajar BOOLEAN DEFAULT FALSE,
    trabajo_remoto_preferido BOOLEAN DEFAULT FALSE,
    
    -- CV y documentos
    cv_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Metadata
    fuente VARCHAR(100), -- De dónde llegó (Portal, LinkedIn, Referido, etc.)
    registro_completo BOOLEAN DEFAULT FALSE,
    acepta_terminos BOOLEAN DEFAULT TRUE,
    acepta_comunicaciones BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_registro_completo (registro_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de Vacantes Públicas (Vista pública de vacantes)
CREATE TABLE IF NOT EXISTS public_job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vacante_id INT NOT NULL UNIQUE,
    
    -- Visibilidad
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- Destacada
    
    -- SEO y Marketing
    slug VARCHAR(255) UNIQUE, -- URL amigable: /jobs/desarrollador-senior-bogota
    meta_description TEXT,
    keywords TEXT,
    
    -- Estadísticas
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    
    -- Fechas de publicación
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    
    INDEX idx_slug (slug),
    INDEX idx_public (is_public),
    INDEX idx_featured (is_featured),
    
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla de Notificaciones (Para candidatos y reclutadores)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Destinatario
    user_type ENUM('candidato', 'reclutador', 'admin') NOT NULL,
    user_id INT NOT NULL, -- ID del candidato o usuario
    
    -- Contenido
    tipo VARCHAR(50) NOT NULL, -- 'nueva_vacante', 'match_found', 'estado_cambio', etc.
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    
    -- Metadata
    related_entity VARCHAR(50), -- 'vacante', 'application', etc.
    related_id INT,
    
    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida DATETIME NULL,
    
    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_type, user_id),
    INDEX idx_leida (leida),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabla de Matching Automático (Historial de matches)
CREATE TABLE IF NOT EXISTS auto_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    vacante_id INT NOT NULL,
    candidato_id INT,
    external_candidate_id INT,
    
    -- Score de match
    match_score INT NOT NULL, -- 0-100
    match_reasoning TEXT, -- JSON con razones del match
    
    -- Factores de match
    skills_match_score INT,
    experience_match_score INT,
    education_match_score INT,
    location_match_score INT,
    
    -- Acciones
    notificado BOOLEAN DEFAULT FALSE,
    visto_por_candidato BOOLEAN DEFAULT FALSE,
    aplicado BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_vacante (vacante_id),
    INDEX idx_candidato (candidato_id),
    INDEX idx_score (match_score),
    
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE SET NULL,
    FOREIGN KEY (external_candidate_id) REFERENCES external_candidates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Actualizar tabla de vacantes con campos públicos
ALTER TABLE vacantes 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS descripcion_publica TEXT,
ADD COLUMN IF NOT EXISTS beneficios TEXT,
ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(100),
ADD COLUMN IF NOT EXISTS modalidad_trabajo VARCHAR(50), -- Presencial, Remoto, Híbrido
ADD COLUMN IF NOT EXISTS url_aplicacion VARCHAR(500);

-- 7. Insertar vacantes públicas para las existentes
INSERT INTO public_job_postings (vacante_id, slug, is_public)
SELECT 
    id,
    LOWER(REPLACE(REPLACE(puesto_nombre, ' ', '-'), 'á', 'a')),
    TRUE
FROM vacantes
WHERE estado = 'Abierta'
ON DUPLICATE KEY UPDATE is_public = TRUE;

-- 8. Datos de ejemplo para testing
INSERT INTO external_candidates (nombre, email, telefono, titulo_profesional, experiencia_total_anos, habilidades_tecnicas, areas_interes) VALUES
('Carlos Mendez', 'carlos.mendez@example.com', '+573001234567', 'Desarrollador Full Stack', 5, '["JavaScript", "React", "Node.js", "SQL"]', '["Desarrollo Web", "Tecnología"]'),
('Ana Rodriguez', 'ana.rodriguez@example.com', '+573007654321', 'Diseñadora UX/UI', 3, '["Figma", "Adobe XD", "User Research"]', '["Diseño", "Experiencia de Usuario"]'),
('Luis Garcia', 'luis.garcia@example.com', '+573009876543', 'Ingeniero de Datos', 7, '["Python", "SQL", "Spark", "AWS"]', '["Data Science", "Big Data"]');

-- Grants (si es necesario)
-- GRANT ALL PRIVILEGES ON sistema_gestion_talento.* TO 'your_user'@'localhost';

SELECT 'Database schema updated successfully for DISCOL Talent Platform!' as status;
