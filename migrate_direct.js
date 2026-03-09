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

    console.log('Connected to Railway MySQL');

    try {
        const sql = fs.readFileSync('C:/Users/analistasistema/Desktop/railway_FINAL_AUTO.sql', 'utf8');
        console.log('Read SQL file, length:', sql.length);

        console.log('Executing migration...');
        await connection.query(sql);
        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:');
        console.error(error.message);
    } finally {
        await connection.end();
    }
}

migrate();
