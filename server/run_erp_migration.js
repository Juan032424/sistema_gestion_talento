const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
    console.log('🚀 Iniciando migración ERP...');
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin',
        database: process.env.DB_NAME || 'sistema_gestion_talento',
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado a la base de datos');

        const sqlPath = path.join(__dirname, 'migration_erp_integration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⏳ Ejecutando migración...');
        await connection.query(sql);
        console.log('🎉 Migración completada exitosamente!');
    } catch (error) {
        console.error('❌ Error al ejecutar la migración:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
