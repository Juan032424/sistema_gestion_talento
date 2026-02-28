const pool = require('./db');

async function fix() {
    try {
        console.log('Modifying password_hash to be nullable...');
        await pool.query('ALTER TABLE candidatos MODIFY COLUMN password_hash VARCHAR(255) NULL');
        console.log('✅ Done');
    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        process.exit(0);
    }
}

fix();
