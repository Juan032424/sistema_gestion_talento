
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
    try {
        console.log('--- RUNNING THIRD MIGRATION (ACADEMIC INFO) ---');

        const queries = [
            `ALTER TABLE candidatos ADD COLUMN tiene_tarjeta_profesional VARCHAR(10) DEFAULT 'No';`,
            `ALTER TABLE candidatos ADD COLUMN numero_tarjeta_profesional VARCHAR(100) DEFAULT NULL;`,
            `ALTER TABLE candidatos ADD COLUMN formacion_academica JSON DEFAULT NULL;`
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
