const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'sistema_gestion_talento'
    });

    try {
        const [rows] = await conn.query(`
            SELECT a.*, 
                   v.puesto_nombre,
                   c.nombre as candidato_nombre_interno
            FROM applications a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            LEFT JOIN candidatos c ON a.candidato_id = c.id
            WHERE a.vacante_id = 775
        `);
        console.log("Success! ", rows.length, "rows returned");
    } catch(err) {
        console.error("Error executing query:");
        console.error(err);
    }

    await conn.end();
}

main().catch(console.error);
