const pool = require('./db');

async function checkCandidatos() {
    try {
        console.log('Checking candidatos table...\n');

        const [rows] = await pool.query("SHOW TABLES LIKE 'candidatos'");
        if (rows.length > 0) {
            console.log('✅ candidatos table exists');
            const [columns] = await pool.query("SHOW COLUMNS FROM candidatos");
            console.log('Columns:', columns.map(c => c.Field).join(', '));
        } else {
            console.log('❌ candidatos table does NOT exist');
        }

        const [rowsSeg] = await pool.query("SHOW TABLES LIKE 'candidatos_seguimiento'");
        if (rowsSeg.length > 0) {
            console.log('\n✅ candidatos_seguimiento table exists');
            const [columns] = await pool.query("SHOW COLUMNS FROM candidatos_seguimiento");
            console.log('Columns:', columns.map(c => c.Field).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkCandidatos();
