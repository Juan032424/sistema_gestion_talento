const pool = require('./db');
const dotenv = require('dotenv');
dotenv.config();

async function checkLogs() {
    try {
        const [logs] = await pool.query('SELECT * FROM agent_logs ORDER BY id DESC LIMIT 10');
        console.log('--- RECENT AGENT LOGS ---');
        logs.forEach(log => {
            console.log(`[${log.performed_at.toISOString()}] ${log.agent_name} | ${log.status} | ${log.details}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLogs();
