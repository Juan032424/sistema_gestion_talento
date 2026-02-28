
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'sistema_gestion_talento'
});


const migrationFile = path.resolve(__dirname, 'migrations/fix_schema_issues.sql');

async function runMigration() {
    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());

        console.log(`Running ${commands.length} commands from ${migrationFile}...`);

        for (const cmd of commands) {
            if (cmd.trim()) {
                console.log(`Executing: ${cmd.substring(0, 50)}...`);
                try {
                    await pool.query(cmd);
                    console.log('✅ OK');
                } catch (e) {
                    console.error('❌ Error:', e.message);
                }
            }
        }
        console.log('Migration completed.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit();
    }
}

runMigration();
