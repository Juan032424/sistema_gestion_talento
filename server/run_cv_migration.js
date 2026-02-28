const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_candidato_vacante.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration:', sql);

        await pool.query(sql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

runMigration();
