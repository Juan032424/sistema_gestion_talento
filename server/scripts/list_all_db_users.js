const pool = require('../db');

async function listUsers() {
    try {
        const [rows] = await pool.query('SELECT id, email, full_name, password_hash, status, role_id, cedula FROM users');
        console.log("=== TODOS LOS USUARIOS EN LA BD DE GH-SCORE ===");
        console.table(rows);
        process.exit(0);
    } catch (e) {
        console.error("❌ Error al listar usuarios:", e.message);
        process.exit(1);
    }
}

listUsers();
