
const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function check() {
    try {
        console.log('--- TABLE STRUCTURES ---');

        const tables = ['candidatos', 'candidatos_seguimiento'];

        for (const table of tables) {
            console.log(`\nChecking ${table}:`);
            try {
                const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
                console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
            } catch (e) {
                console.log(`Table ${table} does not exist or error: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Script error:', error);
    } finally {
        process.exit();
    }
}

check();
