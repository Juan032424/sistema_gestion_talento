CREATE DATABASE IF NOT EXISTS sistema_gestion_talento;
USE sistema_gestion_talento;

CREATE TABLE IF NOT EXISTS sedes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS procesos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);

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
    presupuesto_aprobado DECIMAL(12,2),
    costo_vacante DECIMAL(12,2) DEFAULT 0,
    observaciones TEXT,
    dias_sla_meta INT DEFAULT 15,
    salario_base_ofrecido DECIMAL(12,2) DEFAULT 0.00,
    costo_final_contratacion DECIMAL(12,2) DEFAULT 0.00,
    FOREIGN KEY (proceso_id) REFERENCES procesos(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
);

CREATE TABLE IF NOT EXISTS candidatos_seguimiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vacante_id INT,
    nombre_candidato VARCHAR(150),
    etapa_actual VARCHAR(50),
    fuente_reclutamiento VARCHAR(100),
    salario_pretendido DECIMAL(12,2),
    fecha_entrevista DATE,
    estado_entrevista ENUM('Pendiente', 'En Curso', 'Realizada', 'No Asistió') DEFAULT 'Pendiente',
    resultado_candidato ENUM('Apto', 'No Apto', 'En Reserva'),
    motivo_no_apto TEXT,
    estatus_90_dias ENUM('Continúa', 'Retiro Voluntario', 'Retiro por Desempeño'),
    cv_url VARCHAR(255),
    fecha_postulacion DATE,
    calificacion_tecnica DECIMAL(3,1) DEFAULT 0.0,
    resultado_final VARCHAR(255),
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
);

-- Seed some initial data for dropdowns
INSERT IGNORE INTO sedes (id, nombre) VALUES (1, 'Sede Principal'), (2, 'Planta Norte'), (3, 'Sucursal Sur');
INSERT IGNORE INTO procesos (id, nombre) VALUES (1, 'Administrativo'), (2, 'Operativo'), (3, 'Comercial');
