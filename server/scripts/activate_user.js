const pool = require('../db');

async function activate() {
    try {
        await pool.query(
            "UPDATE users SET status = 'active', role_id = 3 WHERE email = 'nuevo.analista@discolsas.com'"
        );
        console.log("✅ Usuario 'nuevo.analista@discolsas.com' activado y configurado como Lider.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error al activar usuario:", e.message);
        process.exit(1);
    }
}

activate();
