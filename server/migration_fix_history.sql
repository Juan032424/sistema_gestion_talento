-- Crear tabla historial_etapas si no existe
CREATE TABLE IF NOT EXISTS historial_etapas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vacante_id INT NOT NULL,
    candidato_id INT NOT NULL,
    etapa_nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NULL,
    notas TEXT,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id),
    FOREIGN KEY (candidato_id) REFERENCES candidatos_seguimiento(id)
);

-- Asegurar triggers de historial
DROP TRIGGER IF EXISTS tr_cierre_etapa_anterior;
CREATE TRIGGER tr_cierre_etapa_anterior
BEFORE INSERT ON historial_etapas
FOR EACH ROW
BEGIN
    UPDATE historial_etapas 
    SET fecha_fin = CURRENT_TIMESTAMP 
    WHERE candidato_id = NEW.candidato_id AND fecha_fin IS NULL;
END;
