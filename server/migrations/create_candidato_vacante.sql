CREATE TABLE IF NOT EXISTS candidato_vacante (
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    estado_etapa VARCHAR(50) DEFAULT 'POSTULACIÓN',
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (candidato_id, vacante_id),
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE
);
