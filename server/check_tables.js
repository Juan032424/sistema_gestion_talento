const pool = require('./db');

async function checkTables() {
    try {
        console.log('NASA Check: Verifying database tables...');
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Existing tables:', tables.map(t => Object.values(t)[0]));

        const [historySchema] = await pool.query('DESCRIBE historial_etapas');
        console.log('Schema of historial_etapas:', historySchema);

        process.exit(0);
    } catch (e) {
        console.error('NASA Fatal Check Error:', e);
        process.exit(1);
    }
}

checkTables();
