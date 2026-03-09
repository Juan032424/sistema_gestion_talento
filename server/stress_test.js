const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const LOGIN_CREDENTIALS = {
    email: 'superadmin@gh-score.com',
    password: 'password123'
};

const CONCURRENT_REQUESTS = 2000;

async function runStressTest() {
    console.log('🚀 Iniciando Prueba de Estrés...');
    console.log(`🎯 Objetivo: ${BASE_URL}`);
    console.log(`👥 Concurrencia: ${CONCURRENT_REQUESTS} solicitudes\n`);

    try {
        // 1. Obtener Token
        console.log('🔑 Autenticando...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, LOGIN_CREDENTIALS);
        const token = loginRes.data.token;
        console.log('✅ Autenticación exitosa.\n');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const endpoints = [
            { name: 'Listado de Vacantes', url: '/vacantes' },
            { name: 'Listado de Candidatos', url: '/candidatos' },
            { name: 'Estadísticas', url: '/vacantes/stats' }
        ];

        for (const endpoint of endpoints) {
            console.log(`📊 Probando endpoint: ${endpoint.name} (${endpoint.url})`);
            const startTime = Date.now();

            const requests = Array(CONCURRENT_REQUESTS).fill().map(() =>
                axios.get(`${BASE_URL}${endpoint.url}`, config)
                    .then(res => ({ success: true, status: res.status }))
                    .catch(err => ({ success: false, error: err.message, status: err.response?.status }))
            );

            const results = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            const successCount = results.filter(r => r.success).length;
            const failureCount = results.filter(r => !r.success).length;
            const avgTime = (totalTime / CONCURRENT_REQUESTS).toFixed(2);

            console.log(`   ✅ Exitosas: ${successCount}`);
            console.log(`   ❌ Fallidas: ${failureCount}`);
            console.log(`   ⏱️ Tiempo Total: ${totalTime}ms`);
            console.log(`   🕒 Tiempo Promedio: ${avgTime}ms\n`);

            if (failureCount > 0) {
                console.log('   ⚠️ Detalle de errores (primeros 5):');
                results.filter(r => !r.success).slice(0, 5).forEach((r, i) => {
                    console.log(`      ${i + 1}. Status: ${r.status} - Error: ${r.error}`);
                });
                console.log('');
            }
        }

        console.log('🏁 Prueba de estrés completada.');

    } catch (error) {
        console.error('❌ Error crítico durante la prueba:', error.message);
        if (error.response) {
            console.error('   Respuesta del servidor:', error.response.data);
        }
    }
}

runStressTest();
