const pool = require('./db');

async function checkTriggers() {
    try {
        const [rows] = await pool.query("SHOW TRIGGERS");
        for (const row of rows) {
            console.log(`Trigger: ${row.Trigger}`);
            console.log(`Table: ${row.Table}`);
            console.log(`Event: ${row.Event}`);
            console.log(`Timing: ${row.Timing}`);
            console.log(`Statement: ${row.Statement}`);
            console.log('---');
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

checkTriggers();
