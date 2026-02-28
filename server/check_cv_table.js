const pool = require('./db');

async function checkTable() {
    try {
        const [rows] = await pool.query("SHOW TABLES LIKE 'candidato_vacante'");
        if (rows.length > 0) {
            console.log('✅ candidato_vacante exists');
        } else {
            console.log('❌ candidato_vacante does NOT exist');
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

checkTable();
