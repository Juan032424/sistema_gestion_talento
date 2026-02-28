const pool = require('./db');

async function checkTriggers() {
    try {
        const [rows] = await pool.query("SHOW TRIGGERS LIKE 'candidatos_seguimiento'");
        console.log(rows.map(r => ({
            Trigger: r.Trigger,
            Event: r.Event,
            Statement: r.Statement
        })));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

checkTriggers();
