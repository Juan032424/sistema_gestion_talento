-- =====================================================
-- DISCOL TALENT PLATFORM - INTEGRATION ERP SCHEMA
-- Integración ERP sin afectar datos existentes
-- Fecha: 2026-03-25
-- =====================================================

USE sistema_gestion_talento;

-- =====================================================
-- 1. TABLA CANDIDATOS ERP (Hoja de Vida del ERP)
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_candidatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    identificacion VARCHAR(50) UNIQUE NOT NULL,  -- PK en ERP
    tipo_id ENUM('Cedula', 'Cedula Extranjeria', 'Tarjeta Identidad', 'Pasaporte') DEFAULT 'Cedula',
    lugar_expedicion VARCHAR(100),
    fecha_expedicion DATE,
    
    -- Datos personales
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    
    -- Contacto
    email VARCHAR(255),
    telefono VARCHAR(20),
    
    -- Ubicación
    municipio_ciudad VARCHAR(100),
    departamento VARCHAR(100),
    direccion TEXT,
    
    -- Datos demográficos
    fecha_nacimiento DATE,
    genero ENUM('Hombre', 'Mujer', 'Otro', 'Prefiero no decir'),
    grupo_etnico VARCHAR(100),
    estado_civil VARCHAR(50),
    
    -- Académico
    nivel_academico VARCHAR(100),
    tiene_tarjeta_prof BOOLEAN DEFAULT FALSE,
    numero_tarjeta_prof VARCHAR(50),
    
    -- Familia
    tiene_hijos BOOLEAN DEFAULT FALSE,
    cantidad_hijos INT DEFAULT 0,
    es_cabeza_familia BOOLEAN DEFAULT FALSE,
    tiene_discapacidad BOOLEAN DEFAULT FALSE,
    tipo_discapacidad VARCHAR(100),
    
    -- Documentos
    hoja_vida_pdf VARCHAR(500),
    cedula_pdf VARCHAR(500),
    
    -- Tracking
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fuente VARCHAR(50) DEFAULT 'ERP_IMPORT',
    
    -- Índices
    INDEX idx_identificacion (identificacion),
    INDEX idx_email (email),
    INDEX idx_nivel_academico (nivel_academico),
    INDEX idx_fecha_registro (fecha_registro)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. TABLA REQUISICIONES ERP (Requisicion de Personal)
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_requisiciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación ERP
    idu_requisicion VARCHAR(20) UNIQUE NOT NULL,  -- RP0014, RP0179, etc.
    
    -- Solicitante
    nombre_solicitante VARCHAR(200) NOT NULL,
    cedula_solicitante VARCHAR(50),
    
    -- Puesto
    puesto_solicitado VARCHAR(150) NOT NULL,
    numero_vacantes INT DEFAULT 1,
    
    -- Detalle del puesto
    jornada_laboral VARCHAR(50),
    lugar_trabajo VARCHAR(100),
    tipo_contrato VARCHAR(100),
    duracion_contrato VARCHAR(100),
    
    -- Requisitos
    nivel_academico_requerido VARCHAR(100),
    experiencia_requerida VARCHAR(100),
    requiere_vehiculo BOOLEAN DEFAULT FALSE,
    tipo_vehiculo VARCHAR(100),
    requiere_licencia BOOLEAN DEFAULT FALSE,
    tipo_licencia VARCHAR(100),
    requiere_celular BOOLEAN DEFAULT FALSE,
    
    -- Compensación
    salario_ofrecido DECIMAL(15,2),
    bono_salarial BOOLEAN DEFAULT FALSE,
    
    -- Gestión
    area_proyecto VARCHAR(150),
    motivo_solicitud VARCHAR(100),
    requiere_padrino_acogida BOOLEAN DEFAULT FALSE,
    nombre_padrino VARCHAR(200),
    cedula_padrino VARCHAR(50),
    
    -- Estado
    estatus_aprobacion ENUM('Rechazado', 'Aprobado', 'No Aprobado', 'Pendiente') DEFAULT 'Pendiente',
    
    -- Notas
    requerimientos_adicionales TEXT,
    observaciones TEXT,
    
    -- Tracking
    fecha_requisicion DATE NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    paso_flujo VARCHAR(100),
    enlace_detalle VARCHAR(500),
    
    -- Relación con tabla vacantes (si existe)
    vacante_id INT,
    
    -- Índices
    INDEX idx_idu (idu_requisicion),
    INDEX idx_puesto (puesto_solicitado),
    INDEX idx_estatus (estatus_aprobacion),
    INDEX idx_area (area_proyecto),
    INDEX idx_fecha (fecha_requisicion),
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. TABLA ASPIRANTES ERP (Registros de Aspirantes)
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_aspirantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación ERP
    idu_aspirante VARCHAR(20) UNIQUE NOT NULL,  -- RA0007, RA0066, etc.
    
    -- Relaciones con ERP
    idu_requisicion VARCHAR(20) NOT NULL,  -- RP0016, etc. - referencia a requisición
    numero_cedula VARCHAR(50) NOT NULL,    -- Referencia a candidato
    
    -- Datos del aspirante
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100),
    segundo_apellido VARCHAR(100),
    email VARCHAR(255),
    telefono VARCHAR(20),
    genero VARCHAR(20),
    fecha_nacimiento DATE,
    
    -- Puesto aplicado
    cargo_aspirante VARCHAR(150),
    area_proyecto VARCHAR(150),
    
    -- Evaluación
    experiencia_anos INT DEFAULT 0,
    experiencia_requerida_rangos VARCHAR(100),
    fuente_reclutamiento VARCHAR(100),
    
    -- Resultados de evaluación
    evaluacion_puntaje INT DEFAULT 0,  -- Componente de puntuación
    competencia_requerida INT DEFAULT 0,
    competencia_sensibilidad VARCHAR(50),
    competencia_enfoque VARCHAR(50),
    competencia_orientacion VARCHAR(50),
    resultado_evaluacion INT DEFAULT 0,  -- Score final evaluación
    experiencia_score INT DEFAULT 0,
    academico_score INT DEFAULT 0,
    
    -- Estado del proceso
    decision_seleccion ENUM('Seleccionado', 'En proceso', 'No apto', 'Pendiente') DEFAULT 'Pendiente',
    concepto_final TEXT,
    
    -- Documentación
    hoja_vida_pdf VARCHAR(500),
    hoja_vida_filename VARCHAR(255),
    entrevistador_nombre VARCHAR(150),
    entrevistador_cedula VARCHAR(50),
    documento_sarlaft VARCHAR(500),
    
    -- Compatibilidades
    tiene_moto_vehiculo BOOLEAN DEFAULT FALSE,
    documentos_al_dia BOOLEAN DEFAULT FALSE,
    licencia_vigente BOOLEAN DEFAULT FALSE,
    soat_vigente BOOLEAN DEFAULT FALSE,
    tecnicomecanica_vigente BOOLEAN DEFAULT FALSE,
    aprobacion_revision_vial BOOLEAN DEFAULT FALSE,
    
    -- Preguntas de salud
    problema_salud_1 VARCHAR(10) DEFAULT 'No',  -- Problemas en tratamiento
    problema_salud_2 VARCHAR(10) DEFAULT 'No',  -- En seguimiento médico
    problema_salud_3 VARCHAR(10) DEFAULT 'No',  -- Cirugía pendiente
    problema_salud_4 VARCHAR(10) DEFAULT 'No',  -- Terapia pendiente
    problema_salud_5 VARCHAR(10) DEFAULT 'No',  -- Enfermedad laboral
    restriccion_trabajo VARCHAR(10) DEFAULT 'No',  -- Restricciones laborales
    
    -- Herramientas
    dispuesto_celular VARCHAR(10) DEFAULT 'No',
    tiene_casco_moto VARCHAR(10) DEFAULT 'No',
    ano_matricula_moto VARCHAR(4),
    
    -- Compatibilidades DISCOL
    trabajo_previo_discol VARCHAR(10) DEFAULT 'No',
    tiene_familiares_discol VARCHAR(10) DEFAULT 'No',
    labora_empresas_vinculadas VARCHAR(10) DEFAULT 'No',
    
    -- Tracking
    fecha_solicitud DATETIME,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    paso_flujo VARCHAR(100),
    enlace_detalle VARCHAR(500),
    
    -- Relación con sistema interno
    candidato_erp_id INT,
    requisicion_erp_id INT,
    
    -- Índices
    INDEX idx_idu (idu_aspirante),
    INDEX idx_idu_requisicion (idu_requisicion),
    INDEX idx_cedula (numero_cedula),
    INDEX idx_decision (decision_seleccion),
    INDEX idx_fecha (fecha_solicitud),
    FOREIGN KEY (candidato_erp_id) REFERENCES erp_candidatos(id) ON DELETE SET NULL,
    FOREIGN KEY (requisicion_erp_id) REFERENCES erp_requisiciones(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TABLA CONTRATACIONES ERP (Registros de Contratación)
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_contrataciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación ERP
    idu_contrato VARCHAR(20) UNIQUE NOT NULL,  -- RC0001, RC0015, etc.
    
    -- Relación con aspirante
    idu_aspirante VARCHAR(20) NOT NULL,  -- RA0003, etc.
    numero_cedula VARCHAR(50),
    
    -- Datos del empleado
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100),
    segundo_apellido VARCHAR(100),
    
    -- Puesto
    cargo VARCHAR(150),
    proyecto_asignado VARCHAR(150),
    ciudad_municipio VARCHAR(100),
    
    -- Documentación requerida
    examenes_medicos_pdf VARCHAR(500),
    examenes_medicos_estado ENUM('Pendiente', 'Completo', 'Rechazado') DEFAULT 'Pendiente',
    
    cedula_pdf VARCHAR(500),
    cedula_estado ENUM('Pendiente', 'Recibido', 'Validado') DEFAULT 'Pendiente',
    
    hoja_vida_pdf VARCHAR(500),
    hoja_vida_estado ENUM('Pendiente', 'Recibido', 'Validado') DEFAULT 'Pendiente',
    
    policia_antecedentes_pdf VARCHAR(500),
    policia_estado ENUM('Pendiente', 'Completo', 'Rechazado') DEFAULT 'Pendiente',
    
    certificacion_bancaria_pdf VARCHAR(500),
    certificacion_estado ENUM('Pendiente', 'Completo') DEFAULT 'Pendiente',
    
    licencia_conducir_pdf VARCHAR(500),
    licencia_estado ENUM('Pendiente', 'Validado') DEFAULT 'Pendiente',
    
    medidas_correctivas_pdf VARCHAR(500),
    medidas_estado ENUM('No aplica', 'Completado') DEFAULT 'No aplica',
    
    sarlaft_pdf VARCHAR(500),
    sarlaft_estado ENUM('Pendiente', 'Completo', 'Rechazado') DEFAULT 'Pendiente',
    
    aptitud_laboral_pdf VARCHAR(500),
    aptitud_estado ENUM('Pendiente', 'Apto', 'No apto') DEFAULT 'Pendiente',
    
    -- Tipo de proceso
    tipo_proceso ENUM('Directo', 'Regular', 'Especial') DEFAULT 'Regular',
    evidencia_texto TEXT,
    
    -- Estado general
    estado_vinculacion ENUM('Regular', 'Contractual', 'Suspendido', 'Finalizado', 'En proceso') DEFAULT 'En proceso',
    
    -- Tracking
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por VARCHAR(100),
    
    -- Relaciones internas
    aspirante_erp_id INT,
    
    -- Índices
    INDEX idx_idu (idu_contrato),
    INDEX idx_idu_aspirante (idu_aspirante),
    INDEX idx_cedula (numero_cedula),
    INDEX idx_estado (estado_vinculacion),
    INDEX idx_fecha (fecha_creacion),
    FOREIGN KEY (aspirante_erp_id) REFERENCES erp_aspirantes(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. TABLA DE VINCULACIÓN - Candidatos con Solicitantes ERP
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_vinculaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Candidato del sistema (si existe)
    candidate_account_id INT,
    
    -- Candidato del ERP
    candidato_erp_id INT NOT NULL,
    
    -- Track de vinculación
    vinculacion_type ENUM('Manual', 'Automática', 'Sistema') DEFAULT 'Manual',
    fecha_vinculacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Control
    activa BOOLEAN DEFAULT TRUE,
    notas TEXT,
    
    -- Índices
    INDEX idx_candidate (candidate_account_id),
    INDEX idx_erp (candidato_erp_id),
    UNIQUE KEY unique_vinculacion (candidate_account_id, candidato_erp_id),
    FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (candidato_erp_id) REFERENCES erp_candidatos(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TABLA DE APLICACIONES INTEGRADA (Historial Dual)
-- =====================================================
-- Amplia tabla applications existente para incluir tracking ERP
ALTER TABLE applications ADD COLUMN IF NOT EXISTS idu_requisicion_erp VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS idu_aspirante_erp VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS idu_contrato_erp VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sincronizado_erp BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ultima_sincronizacion DATETIME;
ALTER TABLE applications ADD INDEX idx_idu_req_erp (idu_requisicion_erp);
ALTER TABLE applications ADD INDEX idx_idu_asp_erp (idu_aspirante_erp);

-- =====================================================
-- 7. VISTAS PARA FACILITAR CONSULTAS INTEGRADAS
-- =====================================================

-- Vista: Candidatos con su historial completo
DROP VIEW IF EXISTS vw_candidatos_historial_completo;
CREATE VIEW vw_candidatos_historial_completo AS
SELECT 
    c.identificacion,
    c.primer_nombre,
    c.primer_apellido,
    c.email,
    c.telefono,
    COUNT(DISTINCT a.id) as total_aspiraciones,
    COUNT(DISTINCT cont.id) as total_contrataciones,
    MAX(a.fecha_solicitud) as ultima_aspiracion,
    MAX(cont.fecha_creacion) as ultima_contratacion
FROM erp_candidatos c
LEFT JOIN erp_aspirantes a ON c.id = a.candidato_erp_id
LEFT JOIN erp_contrataciones cont ON a.id = cont.aspirante_erp_id
GROUP BY c.id;

-- Vista: Flujo completo de una requisición
DROP VIEW IF EXISTS vw_requisicion_flujo_completo;
CREATE VIEW vw_requisicion_flujo_completo AS
SELECT 
    r.idu_requisicion,
    r.puesto_solicitado,
    r.estatus_aprobacion,
    COUNT(DISTINCT a.id) as aspirantes_totales,
    SUM(CASE WHEN a.decision_seleccion = 'Seleccionado' THEN 1 ELSE 0 END) as seleccionados,
    SUM(CASE WHEN a.decision_seleccion = 'No apto' THEN 1 ELSE 0 END) as no_aptos,
    COUNT(DISTINCT cont.id) as contratados,
    GROUP_CONCAT(DISTINCT a.idu_aspirante) as aspirantes_ids
FROM erp_requisiciones r
LEFT JOIN erp_aspirantes a ON r.idu_requisicion = a.idu_requisicion
LEFT JOIN erp_contrataciones cont ON a.id = cont.aspirante_erp_id
GROUP BY r.id;

-- Vista: Estado del proceso para cada candidato
DROP VIEW IF EXISTS vw_candidato_estado_proceso;
CREATE VIEW vw_candidato_estado_proceso AS
SELECT 
    c.identificacion,
    CONCAT(c.primer_nombre, ' ', c.primer_apellido) as nombre_completo,
    a.idu_aspirante,
    r.idu_requisicion,
    r.puesto_solicitado,
    a.decision_seleccion,
    cont.idu_contrato,
    cont.estado_vinculacion,
    a.resultado_evaluacion as evaluacion_score,
    a.fecha_solicitud as fecha_aspiracion,
    cont.fecha_creacion as fecha_contrato
FROM erp_candidatos c
LEFT JOIN erp_aspirantes a ON c.id = a.candidato_erp_id
LEFT JOIN erp_requisiciones r ON a.idu_requisicion = r.idu_requisicion
LEFT JOIN erp_contrataciones cont ON a.id = cont.aspirante_erp_id
WHERE a.id IS NOT NULL;

-- =====================================================
-- CONFIRMACIÓN
-- =====================================================
SELECT '✅ SCHEMA ERP INTEGRADO CREADO EXITOSAMENTE' AS status;
SELECT CONCAT('📊 Tablas creadas: ', COUNT(*)) as tablas FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sistema_gestion_talento' AND TABLE_NAME LIKE 'erp_%';
