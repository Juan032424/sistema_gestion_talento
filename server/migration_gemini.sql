-- 1. Crear tabla de evaluación
CREATE TABLE IF NOT EXISTS `evaluacion_servicio_gh` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `vacante_id` INT NOT NULL,
    `puntaje_velocidad` INT CHECK (puntaje_velocidad BETWEEN 1 AND 5),
    `puntaje_calidad` INT CHECK (puntaje_calidad BETWEEN 1 AND 5),
    `comentarios_jefe` TEXT,
    CONSTRAINT `fk_eval_vac` FOREIGN KEY (`vacante_id`) REFERENCES `vacantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Agregar columnas a vacantes
ALTER TABLE `vacantes` ADD COLUMN IF NOT EXISTS `dias_sla_meta` INT DEFAULT 15;
ALTER TABLE `vacantes` ADD COLUMN IF NOT EXISTS `salario_base_ofrecido` DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE `vacantes` ADD COLUMN IF NOT EXISTS `costo_final_contratacion` DECIMAL(12,2) DEFAULT 0.00;

-- 3. Agregar columnas a candidatos_seguimiento
ALTER TABLE `candidatos_seguimiento` ADD COLUMN IF NOT EXISTS `calificacion_tecnica` DECIMAL(3,1) DEFAULT 0.0;
ALTER TABLE `candidatos_seguimiento` ADD COLUMN IF NOT EXISTS `resultado_final` VARCHAR(255) DEFAULT NULL;

-- 4. Triggers
DROP TRIGGER IF EXISTS tr_cierre_auto_vacante;
CREATE TRIGGER tr_cierre_auto_vacante
BEFORE UPDATE ON vacantes
FOR EACH ROW
BEGIN
    IF NEW.estado = 'Cubierta' AND OLD.estado <> 'Cubierta' THEN
        SET NEW.fecha_cierre_real = CURDATE();
    END IF;
END;

DROP TRIGGER IF EXISTS tr_cierre_etapa_anterior;
CREATE TRIGGER tr_cierre_etapa_anterior
BEFORE INSERT ON historial_etapas
FOR EACH ROW
BEGIN
    UPDATE historial_etapas 
    SET fecha_fin = CURRENT_TIMESTAMP 
    WHERE candidato_id = NEW.candidato_id AND fecha_fin IS NULL;
END;

-- 5. Vista de KPIs
CREATE OR REPLACE VIEW v_ranking_reclutadores AS
SELECT 
    v.responsable_rh AS Reclutador,
    COUNT(v.id) AS Vacantes_Gestionadas,
    SUM(CASE WHEN v.estado = 'Cubierta' THEN 1 ELSE 0 END) AS Cerradas_Exito,
    ROUND(AVG(DATEDIFF(IFNULL(v.fecha_cierre_real, CURDATE()), v.fecha_apertura)), 1) AS Dias_Promedio_Cierre,
    SUM(CASE WHEN DATEDIFF(IFNULL(v.fecha_cierre_real, CURDATE()), v.fecha_apertura) > v.dias_sla_meta THEN 1 ELSE 0 END) AS Incumplimientos_SLA,
    (SELECT ROUND(AVG(puntaje_calidad), 1) FROM evaluacion_servicio_gh ev WHERE ev.vacante_id IN (SELECT id FROM vacantes v2 WHERE v2.responsable_rh = v.responsable_rh)) AS Satisfaccion_Jefes
FROM vacantes v
GROUP BY v.responsable_rh;
