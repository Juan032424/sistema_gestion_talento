const pool = require('./db');

async function runPatch() {
    try {
        console.log('--- Iniciando aplicación de mejoras de Gemini ---');

        // 1. Crear tabla de evaluación
        console.log('Creando tabla evaluacion_servicio_gh...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`evaluacion_servicio_gh\` (
                \`id\` INT PRIMARY KEY AUTO_INCREMENT,
                \`vacante_id\` INT NOT NULL,
                \`puntaje_velocidad\` INT CHECK (puntaje_velocidad BETWEEN 1 AND 5),
                \`puntaje_calidad\` INT CHECK (puntaje_calidad BETWEEN 1 AND 5),
                \`comentarios_jefe\` TEXT,
                CONSTRAINT \`fk_eval_vac\` FOREIGN KEY (\`vacante_id\`) REFERENCES \`vacantes\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Agregar columnas a vacantes
        console.log('Agregando columnas a vacantes...');
        const vacanteColumns = [
            "ADD COLUMN IF NOT EXISTS \`dias_sla_meta\` INT DEFAULT 15",
            "ADD COLUMN IF NOT EXISTS \`salario_base_ofrecido\` DECIMAL(12,2) DEFAULT 0.00",
            "ADD COLUMN IF NOT EXISTS \`costo_final_contratacion\` DECIMAL(12,2) DEFAULT 0.00"
        ];

        for (const col of vacanteColumns) {
            try {
                await pool.query(`ALTER TABLE \`vacantes\` ${col}`);
            } catch (e) {
                console.log(\`Nota: Could not add column (maybe it exists): \${col}\`);
            }
        }

        // 3. Agregar columnas a candidatos_seguimiento
        console.log('Agregando columnas a candidatos_seguimiento...');
        const candidatoColumns = [
            "ADD COLUMN IF NOT EXISTS \`calificacion_tecnica\` DECIMAL(3,1) DEFAULT 0.0",
            "ADD COLUMN IF NOT EXISTS \`resultado_final\` ENUM('Apto','No Apto','En Reserva') DEFAULT NULL"
        ];
        
        for (const col of candidatoColumns) {
            try {
                await pool.query(`ALTER TABLE \`candidatos_seguimiento\` ${col}`);
            } catch (e) {
                console.log(\`Nota: Could not add column (maybe it exists): \${col}\`);
            }
        }

        // 4. Triggers
        console.log('Configurando Triggers...');
        
        // Trigger para cierre automático de vacante
        await pool.query('DROP TRIGGER IF EXISTS tr_cierre_auto_vacante');
        await pool.query(\`
            CREATE TRIGGER tr_cierre_auto_vacante
            BEFORE UPDATE ON vacantes
            FOR EACH ROW
            BEGIN
                IF NEW.estado = 'Cubierta' AND OLD.estado <> 'Cubierta' THEN
                    SET NEW.fecha_cierre_real = CURDATE();
                END IF;
            END
        \`);

        // Trigger para cierre de etapa anterior
        await pool.query('DROP TRIGGER IF EXISTS tr_cierre_etapa_anterior');
        await pool.query(\`
            CREATE TRIGGER tr_cierre_etapa_anterior
            BEFORE INSERT ON historial_etapas
            FOR EACH ROW
            BEGIN
                UPDATE historial_etapas 
                SET fecha_fin = CURRENT_TIMESTAMP 
                WHERE candidato_id = NEW.candidato_id AND fecha_fin IS NULL;
            END
        \`);

        // 5. Vista de KPIs
        console.log('Creando vista v_ranking_reclutadores...');
        await pool.query(\`
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
        \`);

        console.log('--- Mejoras aplicadas exitosamente ---');
        process.exit(0);
    } catch (error) {
        console.error('Error al aplicar el parche:', error);
        process.exit(1);
    }
}

runPatch();
