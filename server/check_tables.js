const pool = require('./db');

async function check() {
    try {
        console.log('--- APPLICATIONS ---');
        const [appCols] = await pool.query('DESCRIBE applications');
        console.table(appCols.map(c => ({ field: c.Field, type: c.Type })));

        console.log('\n--- CANDIDATOS SEGUIMIENTO ---');
        const [seqCols] = await pool.query('DESCRIBE candidatos_seguimiento');
        console.table(seqCols.map(c => ({ field: c.Field, type: c.Type })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
