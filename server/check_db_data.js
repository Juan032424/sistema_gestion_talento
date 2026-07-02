const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'sistema_gestion_talento'
    });

    console.log("== columns of candidatos ==");
    const [res] = await conn.query("SHOW COLUMNS FROM candidatos");
    console.log(res.map(r => r.Field));

    await conn.end();
}

main().catch(console.error);
