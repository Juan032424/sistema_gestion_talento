const pool = require('./db');

async function checkReferidosTable() {
    try {
        const [columns] = await pool.query('DESCRIBE referidos');
        console.log('--- TABLE STRUCTURE: referidos ---');
        console.table(columns);

        const [counts] = await pool.query('SELECT COUNT(*) as total FROM referidos');
        console.log(`Total records: ${counts[0].total}`);

        const [usersWithPoints] = await pool.query('DESCRIBE users');
        console.log('\n--- TABLE STRUCTURE: users ---');
        console.table(usersWithPoints);

        process.exit(0);
    } catch (error) {
        console.error('Error checking referidos table:', error);
        process.exit(1);
    }
}

checkReferidosTable();
