const pool = require('./db');

async function testConn() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 as result');
        console.log('Connection successful:', rows[0].result);
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        process.exit(0);
    }
}

testConn();
