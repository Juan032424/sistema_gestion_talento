-- ========================================================
-- FASE 1: MIGRACIÓN DE BASE DE DATOS (SQL PRECISO)
-- Adaptación del esquema para usar identificadores del ERP
-- ========================================================

USE sistema_gestion_talento;

-- -------------------------------------------------------------
-- 1. ENTIDAD A: Candidatos (Source: Lista de Hoja de Vida.xlsx)
-- -------------------------------------------------------------
-- Clave Primaria a identificacion (String)
-- NOTA: Dado que 'id' es una foreign key en múltiples tablas, el script primero
-- elimina esas restricciones para poder modificar la PK de manera segura.

-- 1A. Eliminar Foreign Keys existentes que dependan de candidatos.id
ALTER TABLE candidate_skills DROP FOREIGN KEY candidate_skills_ibfk_1;
ALTER TABLE candidate_saved_jobs DROP FOREIGN KEY candidate_saved_jobs_ibfk_1;
ALTER TABLE postulaciones_agiles DROP FOREIGN KEY postulaciones_agiles_ibfk_2;
ALTER TABLE candidate_notifications DROP FOREIGN KEY candidate_notifications_ibfk_1;

-- 1B. Modificar la tabla candidatos
ALTER TABLE candidatos
    ADD COLUMN identificacion VARCHAR(50) NOT NULL UNIQUE FIRST,
    ADD COLUMN tipo_id VARCHAR(50),
    ADD COLUMN lugar_expedicion VARCHAR(100),
    ADD COLUMN municipio_residencia VARCHAR(100),
    ADD COLUMN direccion VARCHAR(255),
    ADD COLUMN fecha_nacimiento DATE,
    ADD COLUMN genero VARCHAR(50),
    ADD COLUMN nivel_academico VARCHAR(100);

-- Si la data actual no tiene identificacion, temporalmente asignarle el id como string
UPDATE candidatos SET identificacion = CAST(id AS CHAR) WHERE identificacion = '';

-- Eliminar id autoincremental como Primary Key
ALTER TABLE candidatos MODIFY id INT NOT NULL;
ALTER TABLE candidatos DROP PRIMARY KEY;
ALTER TABLE candidatos DROP COLUMN id;

-- Establecer nueva llave primaria
ALTER TABLE candidatos ADD PRIMARY KEY (identificacion);

-- 1C. Actualizar tablas relacionadas para que usen la nueva PK (String)
ALTER TABLE candidate_skills MODIFY candidato_id VARCHAR(50) NOT NULL;
ALTER TABLE candidate_saved_jobs MODIFY candidato_id VARCHAR(50) NOT NULL;
ALTER TABLE postulaciones_agiles MODIFY candidato_id VARCHAR(50) NOT NULL;
ALTER TABLE candidate_notifications MODIFY candidato_id VARCHAR(50) NOT NULL;

-- 1D. Restaurar las Foreign Keys
ALTER TABLE candidate_skills ADD CONSTRAINT fk_cs_candidato FOREIGN KEY (candidato_id) REFERENCES candidatos(identificacion) ON DELETE CASCADE;
ALTER TABLE candidate_saved_jobs ADD CONSTRAINT fk_sj_candidato FOREIGN KEY (candidato_id) REFERENCES candidatos(identificacion) ON DELETE CASCADE;
ALTER TABLE postulaciones_agiles ADD CONSTRAINT fk_pa_candidato FOREIGN KEY (candidato_id) REFERENCES candidatos(identificacion) ON DELETE CASCADE;
ALTER TABLE candidate_notifications ADD CONSTRAINT fk_cn_candidato FOREIGN KEY (candidato_id) REFERENCES candidatos(identificacion) ON DELETE CASCADE;


-- ----------------------------------------------------------------------
-- 2. ENTIDAD B: Vacantes (Source: Listado de Requisiciones de Personal)
-- ----------------------------------------------------------------------
ALTER TABLE vacantes
    ADD COLUMN idu_rp VARCHAR(50) UNIQUE,
    ADD COLUMN solicitante_nombre VARCHAR(150),
    ADD COLUMN jornada_laboral VARCHAR(100),
    ADD COLUMN tipo_contrato VARCHAR(100),
    ADD COLUMN formacion_requerida TEXT,
    ADD COLUMN estado_erp ENUM('Aprobada', 'No Aprobada', 'Cerrada');

-- ----------------------------------------------------------------------------
-- 3. ENTIDAD C: Aplicaciones (applications_erp soporta flujo RP -> RA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications_erp (
    idu_ra VARCHAR(50) PRIMARY KEY,
    idu_rp VARCHAR(50) NOT NULL,
    candidato_identificacion VARCHAR(50) NOT NULL,
    resultado_evaluacion VARCHAR(255),
    experiencia_requerida VARCHAR(255),
    estado_aspirante ENUM('Seleccionado', 'En proceso', 'No apto', 'Pendiente') DEFAULT 'Pendiente',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idu_rp) REFERENCES vacantes(idu_rp) ON DELETE CASCADE,
    FOREIGN KEY (candidato_identificacion) REFERENCES candidatos(identificacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ----------------------------------------------------------------------------
-- 4. ENTIDAD D: Contratación (contracts_erp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts_erp (
    idu_rc VARCHAR(50) PRIMARY KEY,
    idu_ra VARCHAR(50) NOT NULL,
    candidato_identificacion VARCHAR(50) NOT NULL,
    estado_vinculacion VARCHAR(100) DEFAULT 'Regular',
    emo_pdf VARCHAR(500),
    identificacion_pdf VARCHAR(500),
    hoja_vida_pdf VARCHAR(500),
    fecha_contratacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idu_ra) REFERENCES applications_erp(idu_ra) ON DELETE CASCADE,
    FOREIGN KEY (candidato_identificacion) REFERENCES candidatos(identificacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
