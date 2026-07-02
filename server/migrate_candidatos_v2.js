
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
    try {
        console.log('--- RUNNING SECOND MIGRATION ---');

        const alters = [
            "ALTER TABLE candidatos ADD COLUMN segundo_nombre VARCHAR(100) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN segundo_apellido VARCHAR(100) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN lugar_expedicion VARCHAR(150) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN fecha_expedicion DATE DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN direccion VARCHAR(255) DEFAULT NULL;",
            "ALTER TABLE candidatos ADD COLUMN fecha_nacimiento DATE DEFAULT NULL;",
            "ALTER TABLE candidatos CHANGE COLUMN nombre primer_nombre VARCHAR(255);",
            "ALTER TABLE candidatos ADD COLUMN primer_apellido VARCHAR(255) DEFAULT NULL;"
        ];

        for (const query of alters) {
            try {
                await pool.query(query);
                console.log(`Success: ${query}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_BAD_FIELD_ERROR') {
                    console.log(`Field already exists or change failed, skipping: ${query} (${e.message})`);
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
