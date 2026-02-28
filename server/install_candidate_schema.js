// ===================================
// 🔧 INSTALL CANDIDATE ACCOUNTS SCHEMA
// Script para instalar las tablas del sistema de candidatos
// ===================================

const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function installSchema() {
    let connection;

    try {
        console.log('🔌 Conectando a la base de datos...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento',
            multipleStatements: true
        });

        console.log('✅ Conectado exitosamente');
        console.log('📄 Leyendo archivo SQL...');

        const sqlFile = fs.readFileSync('./setup_candidate_tables.sql', 'utf8');

        console.log('⚙️  Ejecutando schema...');

        await connection.query(sqlFile);

        console.log('✅ Schema de candidatos instalado exitosamente!');
        console.log('');
        console.log('📊 Tablas creadas:');
        console.log('   - candidate_accounts');
        console.log('   - candidate_skills');
        console.log('   - candidate_education');
        console.log('   - candidate_experience');
        console.log('   - candidate_languages');
        console.log('   - candidate_activity_log');
        console.log('   - candidate_saved_jobs');
        console.log('   - candidate_notifications');
        console.log('   - applications (actualizado)');
        console.log('');
        console.log('✨ El sistema de candidatos está listo para usar!');

    } catch (error) {
        console.error('❌ Error instalando schema:', error.message);
        console.error('');
        console.error('Detalles del error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔚 Conexión cerrada');
        }
    }
}

// Ejecutar
installSchema();
