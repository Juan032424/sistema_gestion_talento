const pool = require('../db');

async function activate() {
    try {
        await pool.query(
            "UPDATE users SET status = 'active', role_id = 4 WHERE email = 'comercial'"
        );
        console.log("✅ Usuario 'comercial' activado con éxito en la base de datos.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error al activar usuario comercial:", e.message);
        process.exit(1);
    }
}

activate();
