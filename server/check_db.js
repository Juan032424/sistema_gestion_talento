const pool = require('./db');
async function check() {
    try {
        const [rows] = await pool.query('DESCRIBE vacantes');
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
