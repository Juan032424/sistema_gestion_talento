require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    const pool = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    const [cols] = await pool.query('DESCRIBE candidatos');
    console.log("candidatos columns:", cols.map(c => c.Field));

    const [cols2] = await pool.query('DESCRIBE sourced_candidates');
    console.log("sourced_candidates columns:", cols2.map(c => c.Field));

    const [cols3] = await pool.query('DESCRIBE applications');
    console.log("applications columns:", cols3.map(c => c.Field));

    pool.end();
}
test();
