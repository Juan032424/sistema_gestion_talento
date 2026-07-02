
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
    try {
        console.log('--- RUNNING MIGRATION ---');

        const alters = [
            "ALTER TABLE candidatos ADD COLUMN tipo_identificacion VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN grupo_etnico VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN genero VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN estado_civil VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN tiene_familiar ENUM('Si', 'No') DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN parentesco_familiar VARCHAR(100) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN nombre_familiar VARCHAR(255) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN telefono_familiar VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN tipo_vivienda VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN servicios_publicos JSON DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN estrato VARCHAR(20) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN tipo_vehiculo VARCHAR(50) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN vehiculo_placa VARCHAR(20) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN vehiculo_marca_modelo VARCHAR(100) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN vehiculo_modelo_ano VARCHAR(20) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN vehiculo_nombre_propietario VARCHAR(255) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN vehiculo_cedula_propietario VARCHAR(50) DEFAULT NULL;"
        ];

        for (const query of alters) {
            try {
                await pool.query(query);
                console.log(`Success: ${query}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Field already exists, skipping: ${query}`);
                } else {
                    console.log(`Error on ${query}: ${e.message}`);
                }
            }
        }
        console.log('--- MIGRATION COMPLETE ---');
    } catch (error) {
        console.error('Script error:', error);
    } finally {
        process.exit();
    }
}

migrate();
