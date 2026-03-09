const pool = require('./db');

async function runMigration() {
    try {
        console.log('👷 Iniciando migración de base de datos...');

        // Add created_by column to vacantes
        await pool.query(`
            ALTER TABLE vacantes 
            ADD COLUMN IF NOT EXISTS created_by INT NULL,
            ADD CONSTRAINT fk_created_by FOREIGN KEY IF NOT EXISTS (created_by) REFERENCES users(id) ON DELETE SET NULL
        `);

        console.log('✅ Columna created_by añadida a vacantes.');
        process.exit(0);
    } catch (error) {
        // If the error is that the column exists, it's fine
        if (error.code === 'ER_DUP_COLUMN_NAME' || error.message.includes('Duplicate column name')) {
            console.log('ℹ️ La columna ya existe.');
            process.exit(0);
        }
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

runMigration();
