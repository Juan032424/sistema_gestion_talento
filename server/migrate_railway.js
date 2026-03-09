const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'interchange.proxy.rlwy.net',
        port: 57434,
        user: 'root',
        password: 'gZXHeuOMTHFlcSGeJQZQYGqBBxEmGUeN',
        database: 'sistema_gestion_talento',
        multipleStatements: true,
        charset: 'utf8mb4'
    });

    console.log('✅ Conectado a Railway MySQL!');

    try {
        let sql = fs.readFileSync('C:/Users/analistasistema/Desktop/railway_FINAL_AUTO.sql', 'utf8');

        // Remove DELIMITER blocks (triggers/procedures) - not supported via mysql2 driver
        sql = sql.replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, '');
        sql = sql.replace(/DELIMITER ;;[\s\S]*?DELIMITER ;/g, '');

        // Remove DEFINER clauses
        sql = sql.replace(/\/\*!50017 DEFINER=[^*]+\*\//g, '');

        // Remove any remaining DELIMITER
        sql = sql.replace(/DELIMITER [^\n]+\n/g, '');

        console.log('📂 SQL procesado, tamaño:', sql.length, 'chars');
        console.log('🚀 Ejecutando migración...');

        await connection.query(sql);
        console.log('🎉 ¡Migración completada!');

        const [rows] = await connection.query("SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'sistema_gestion_talento'");
        console.log('📊 Tablas creadas:', rows[0].total);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Código:', error.code);
    } finally {
        await connection.end();
        console.log('🔌 Conexión cerrada');
    }
}

migrate();
