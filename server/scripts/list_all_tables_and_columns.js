const pool = require('../db');

async function listTables() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log("=== TABLAS EN LA BASE DE DATOS ===");
        
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            console.log(`- Tabla: ${tableName} | Filas: ${count}`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error("❌ Error al listar tablas:", e.message);
        process.exit(1);
    }
}

listTables();
