const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        console.log('🚀 Iniciando script de migración...');

        // Configuración de conexión
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento',
            multipleStatements: true // Importante para ejecutar script SQL completo
        };

        console.log(`🔌 Conectando a BD: ${config.database} en ${config.host}...`);

        connection = await mysql.createConnection(config);
        console.log('✅ Conexión exitosa.');

        // Leer archivo SQL
        const migrationPath = path.join(__dirname, '../migrations/add_candidate_auth_tables.sql');
        console.log(`📄 Leyendo archivo SQL: ${migrationPath}`);

        const sqlContent = fs.readFileSync(migrationPath, 'utf8');

        // Ejecutar migración
        console.log('⚡ Ejecutando queries...');
        await connection.query(sqlContent);

        console.log('✅ Migración ejecutada correctamente.');
        console.log('✅ Tablas creadas/actualizadas exitosamente.');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);

        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('⚠️ La base de datos no existe. Verifica el nombre en .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('⚠️ No se pudo conectar a MySQL. Verifica que esté corriendo.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('⚠️ Acceso denegado. Verifica usuario y contraseña en .env');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada.');
        }
    }
}

runMigration();
