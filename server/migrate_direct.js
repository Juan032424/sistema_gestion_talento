const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'interchange.proxy.rlwy.net',
        port: 57434,
        user: 'root',
        password: 'gZXHeuOMTHFlcSGeJQZQYGqBBxEmGUeN',
        database: 'sistema_gestion_talento',
        multipleStatements: true
    });

    console.log('Conectado a Railway MySQL!');

    try {
        const sql = fs.readFileSync('C:/Users/analistasistema/Desktop/railway_FINAL_AUTO.sql', 'utf8');
        console.log('Archivo SQL leido, tamaño:', sql.length, 'caracteres');

        console.log('Ejecutando migración...');
        await connection.query(sql);
        console.log('✅ Migración completada exitosamente!');

        const [tables] = await connection.query("SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'sistema_gestion_talento'");
        console.log('Total de tablas creadas:', tables[0].total);

    } catch (error) {
        console.error('❌ Error en migración:', error.sqlMessage || error.message);
        console.error('Número de error SQL:', error.errno);
    } finally {
        await connection.end();
    }
}

migrate();
