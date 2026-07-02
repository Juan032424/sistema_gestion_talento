
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
    try {
        console.log('--- RUNNING FOURTH MIGRATION (LABOR & FAMILY & TOOLS) ---');

        const queries = [
            `ALTER TABLE candidatos ADD COLUMN historial_laboral JSON DEFAULT NULL;`,
            `ALTER TABLE candidatos ADD COLUMN tiene_hijos VARCHAR(10) DEFAULT 'No';`,
            `ALTER TABLE candidatos ADD COLUMN cantidad_hijos INT DEFAULT 0;`,
            `ALTER TABLE candidatos ADD COLUMN cabeza_familia VARCHAR(10) DEFAULT 'No';`,
            `ALTER TABLE candidatos ADD COLUMN discapacidad VARCHAR(100) DEFAULT 'No tengo';`,
            `ALTER TABLE candidatos ADD COLUMN dispuesto_celular VARCHAR(10) DEFAULT 'No';`,
            `ALTER TABLE candidatos ADD COLUMN casco_integral VARCHAR(10) DEFAULT 'No';`,
            `ALTER TABLE candidatos ADD COLUMN ano_matricula_moto VARCHAR(20) DEFAULT NULL;`
        ];

        for (const q of queries) {
            try {
                await pool.query(q);
                console.log(`Success: ${q.substring(0, 50)}...`);
            } catch (e) {
                console.log(`Error or Already Added: ${e.message}`);
            }
        }

        console.log('--- MIGRATION COMPLETE ---');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
