const pool = require('./db');

async function checkReferidosOnly() {
    try {
        const [columns] = await pool.query('DESCRIBE referidos');
        console.table(columns);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkReferidosOnly();
