const axios = require('axios');

async function testTracking() {
    try {
        console.log('📡 Enviando prueba de tracking al servidor...');

        // Datos de prueba: Asumimos que el candidato ID 1 existe (creado en pruebas anteriores)
        // Usamos un ID de vacante ficticio 9999
        const payload = {
            candidateId: 1,
            interactionType: 'TEST_MANUAL_SCRIPT'
        };

        const response = await axios.post('http://localhost:3001/api/candidate-auth/track-view/9999', payload);

        console.log('✅ Respuesta del servidor:', response.data);
        console.log('status:', response.status);

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('Datos de respuesta:', error.response.data);
        }
    }
}

testTracking();
