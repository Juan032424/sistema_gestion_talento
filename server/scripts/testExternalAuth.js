const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno del servidor
dotenv.config({ path: path.join(__dirname, '../.env') });

const { encryptPayload, decryptPayload } = require('../utils/cryptoHelper');

async function runTest() {
    const PORT = process.env.PORT || 3001;
    const url = `http://localhost:${PORT}/api/sigae/auth/external-login`;
    const appId = "ghscorepro";

    // Obtener la configuración del cliente del .env para simular al consumidor externo
    let clients = {};
    try {
        clients = JSON.parse(process.env.EXTERNAL_AUTH_CLIENTS || '{}');
    } catch (e) {
        console.error("❌ Error al leer EXTERNAL_AUTH_CLIENTS desde .env:", e.message);
        return;
    }

    const clientConfig = clients[appId];
    if (!clientConfig) {
        console.error(`❌ Cliente '${appId}' no configurado en EXTERNAL_AUTH_CLIENTS en el archivo .env.`);
        return;
    }

    const sharedSecret = clientConfig.encryptionKey;
    const apiKey = clientConfig.apiKey;

    console.log("====================================================");
    console.log("🧪 INICIANDO PRUEBA DE AUTENTICACIÓN EXTERNA CIFRADA");
    console.log("====================================================");
    console.log(`📡 URL del Endpoint: ${url}`);
    console.log(`🔑 Client ID: ${appId}`);
    console.log(`🗝️ API Key: ${apiKey}`);
    console.log(`🔐 Llave de cifrado compartida (primeros 6 chars): ${sharedSecret.substring(0, 6)}...`);

    // 1. Preparar credenciales del usuario (usuario del sistema padre)
    const userCredentials = {
        username: "comercial",
        password: "29discol01"
    };

    console.log("\n👤 Credenciales a enviar:", JSON.stringify(userCredentials));

    // 2. Cifrar credenciales
    console.log("🔒 Cifrando credenciales usando AES-256-GCM...");
    let encryptedPayload;
    try {
        encryptedPayload = encryptPayload(userCredentials, sharedSecret);
        console.log("📦 Payload Cifrado (Base64):", encryptedPayload);
    } catch (err) {
        console.error("❌ Error al cifrar el payload:", err.message);
        return;
    }

    // 3. Realizar la petición POST
    console.log("\n🚀 Enviando petición HTTP POST...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                appId: appId,
                payload: encryptedPayload
            })
        });

        console.log(`📥 Código de Respuesta HTTP: ${response.status} (${response.statusText})`);

        const responseBody = await response.json();
        console.log("📄 Cuerpo de Respuesta HTTP (Contenedor externo):", JSON.stringify(responseBody, null, 2));

        if (!responseBody.success) {
            console.error("❌ Error devuelto por la API:", responseBody.message);
            return;
        }

        // 4. Descifrar la respuesta
        console.log("\n🔓 Descifrando el payload de respuesta de la API...");
        const decryptedResponse = decryptPayload(responseBody.data.payload, sharedSecret);
        console.log("🎉 Contenido Descifrado con Éxito:", JSON.stringify(decryptedResponse, null, 2));

        if (decryptedResponse.status === "authenticated" && decryptedResponse.token) {
            console.log("\n✅ PRUEBA EXITOSA: Autenticación externa cifrada completada correctamente!");
        } else {
            console.log("\n⚠️ La respuesta se descifró pero el estado no es 'authenticated' o no contiene un token.");
        }

    } catch (error) {
        console.error("❌ Error al conectar con el servidor:", error.message);
        console.log("💡 Asegúrate de que el servidor Express de GH-SCORE esté corriendo en el puerto", PORT);
    }
}

runTest();
