
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function check() {
    try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM candidatos`);
        console.log('Columns for candidatos:');
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
    } catch (error) {
        console.error('Script error:', error);
    } finally {
        process.exit();
    }
}
check();
