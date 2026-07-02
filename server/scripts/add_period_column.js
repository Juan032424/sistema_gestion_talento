const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'sistema_gestion_talento'
    });

    try {
        console.log("Adding 'periodo' column to vacantes...");
        await conn.query(`
            ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS periodo VARCHAR(50) DEFAULT 'Actual'
        `);
        console.log("Column added.");

        console.log("Updating existing vacantes to 'Histórico Migración'...");
        await conn.query(`
            UPDATE vacantes SET periodo = 'Histórico Migración' WHERE periodo = 'Actual' OR periodo IS NULL
        `);
        console.log("Vacantes updated.");
    } catch(err) {
        console.error("Migration error:", err);
    }

    await conn.end();
}

main().catch(console.error);
