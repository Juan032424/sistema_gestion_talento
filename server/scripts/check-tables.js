const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
    let connection;
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        };

        connection = await mysql.createConnection(config);

        console.log(`🔌 Conectado a ${config.database}`);
        console.log('📋 Buscando tablas...');

        const [rows] = await connection.query('SHOW TABLES');

        console.log('\n--- TABLAS EN BASE DE DATOS ---');
        rows.forEach(row => {
            console.log(`- ${Object.values(row)[0]}`);
        });
        console.log('-------------------------------\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

listTables();
