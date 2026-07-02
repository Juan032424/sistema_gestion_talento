const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function searchEmpleados() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: 3306
        };

        const connection = await mysql.createConnection(config);
        const [dbRows] = await connection.query('SHOW DATABASES');
        
        console.log("🔍 Buscando tabla 'empleados' en todas las bases de datos...");
        
        for (const dbRow of dbRows) {
            const dbName = dbRow.Database;
            try {
                const [tableRows] = await connection.query(`SHOW TABLES FROM \`${dbName}\``);
                for (const tableRow of tableRows) {
                    const tableName = Object.values(tableRow)[0];
                    if (tableName.toLowerCase() === 'empleados') {
                        console.log(`✨ ¡Encontrada tabla 'empleados' en base de datos: '${dbName}'!`);
                        const [colRows] = await connection.query(`SHOW COLUMNS FROM \`${dbName}\`.\`${tableName}\``);
                        console.table(colRows);
                    }
                }
            } catch (err) {
                // Ignorar bases de datos inaccesibles
            }
        }
        
        await connection.end();
        console.log("🏁 Búsqueda finalizada.");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

searchEmpleados();
