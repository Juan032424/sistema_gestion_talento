const pool = require('./db');
require('dotenv').config();

async function checkSchema() {
    try {
        console.log('🔍 Checking candidatos table schema...');
        const [columns] = await pool.query('DESCRIBE candidatos');
        console.log(columns);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
