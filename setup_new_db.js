require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    console.log('🚀 Iniciando creación de nueva Base de Datos v3...');

    // Configuración desde .env o manual
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log(`✅ Conectado a ${config.host} como ${config.user}`);

        const sqlPath = path.join(__dirname, 'DATABASE_MASTER_V3.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⏳ Ejecutando script maestro (esto puede tardar unos segundos)...');
        await connection.query(sql);

        console.log('🎉 ¡Base de Datos creada y configurada exitosamente!');

    } catch (error) {
        console.error('❌ Error al crear la base de datos:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

initializeDatabase();
