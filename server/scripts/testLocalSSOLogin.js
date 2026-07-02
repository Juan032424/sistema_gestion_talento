const dotenv = require('dotenv');
const path = require('path');

// Cargar variables del servidor
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSSO() {
    const PORT = process.env.PORT || 3001;
    const url = `http://localhost:${PORT}/api/auth/login`;

    console.log("====================================================");
    console.log("🧪 PROBANDO LOGIN INTEGRADO CON SISTEMA PADRE (SSO)");
    console.log("====================================================");
    console.log(`📡 Endpoint de Login Local: ${url}`);
    console.log(`👤 Intentando iniciar sesión como: 'logistica' con clave del Sistema Padre...`);

    try {
        // 1. Primer intento de inicio de sesión
        const response1 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'logistica', password: '32discol03' })
        });

        console.log(`\n📥 [Intento 1] Código HTTP: ${response1.status} (${response1.statusText})`);
        const body1 = await response1.json();
        console.log("📄 Respuesta:", JSON.stringify(body1, null, 2));

        if (response1.status === 403) {
            console.log("\n✅ PASO 1 COMPLETO: Usuario nuevo registrado y bloqueado en estado inactivo.");
            
            // 2. Simular que el Administrador activa la cuenta y le asigna el rol
            console.log("\n🛠️ Simulando activación del administrador para 'logistica' (Rol Lider)...");
            const pool = require('../db');
            await pool.query(
                "UPDATE users SET status = 'active', role_id = 3 WHERE email = 'logistica'"
            );
            console.log("✨ Usuario 'logistica' activado con éxito.");

            // 3. Segundo intento de inicio de sesión
            console.log("\n👤 [Intento 2] Intentando iniciar sesión nuevamente como 'logistica'...");
            const response2 = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'logistica', password: '32discol03' })
            });

            console.log(`📥 Código HTTP: ${response2.status} (${response2.statusText})`);
            const body2 = await response2.json();
            console.log("📄 Respuesta:", JSON.stringify(body2, null, 2));

            if (response2.ok && body2.success) {
                console.log("\n🎉 PRUEBA COMPLETADA CON ÉXITO: Usuario del sistema padre autenticado, aprovisionado y logueado!");
            } else {
                console.error("\n❌ Falló el segundo intento de inicio de sesión.");
            }
        } else {
            console.error("\n❌ El primer intento no arrojó el estado 403 esperado.");
        }

    } catch (err) {
        console.error("❌ Error de comunicación:", err.message);
    }

    process.exit(0);
}

testSSO();
