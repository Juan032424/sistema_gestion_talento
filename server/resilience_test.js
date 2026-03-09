const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const LOGIN_CREDENTIALS = {
    email: 'superadmin@gh-score.com',
    password: 'password123'
};

async function runResilienceTest() {
    console.log('🛡️ Iniciando Prueba de Resiliencia (Chaos/Negative Testing)...');
    console.log('OBJETIVO: Intentar romper el sistema con datos inválidos o malintencionados.\n');

    try {
        console.log('🔑 Autenticando...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, LOGIN_CREDENTIALS);
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Autenticación exitosa.\n');

        const testCases = [
            {
                name: '1. SQL Injection Attempt (In Name Filter)',
                method: 'get',
                url: "/candidatos?name=' OR '1'='1",
                expected: 'No crash'
            },
            {
                name: '2. XSS Attempt (In Candidate Name)',
                method: 'post',
                url: '/candidatos',
                data: { nombre_candidato: '<script>alert("XSS")</script>', vacante_id: 1 },
                expected: 'Sanitized or Safe handled'
            },
            {
                name: '3. Oversized Payload (Huge Name)',
                method: 'post',
                url: '/candidatos',
                data: { nombre_candidato: 'A'.repeat(10000), vacante_id: 1 },
                expected: 'Handled or Rejected'
            },
            {
                name: '4. Logic Error (End Date < Start Date)',
                method: 'post',
                url: '/vacantes',
                data: {
                    puesto_nombre: 'Resilience Test',
                    fecha_apertura: '2024-12-31',
                    fecha_cierre_estimada: '2024-01-01',
                    sede_id: 1,
                    proceso_id: 1,
                    codigo_requisicion: 'RE-CHAOS-01'
                },
                expected: 'Validation error'
            },
            {
                name: '5. Invalid Reference (Non-existent Vacancy ID)',
                method: 'post',
                url: '/candidatos',
                data: { nombre_candidato: 'Ghost Candidate', vacante_id: 999999 },
                expected: 'Error handle (Foreign Key)'
            },
            {
                name: '6. Malformed JSON Body',
                method: 'post',
                url: '/candidatos',
                rawBody: '{ "name": "Incomplete JSON", ',
                expected: 'Empty/Handled'
            },
            {
                name: '7. Invalid Data Types (Numbers for Strings)',
                method: 'post',
                url: '/candidatos',
                data: { nombre_candidato: 123456789, vacante_id: "NOT_A_NUMBER" },
                expected: 'Rejected or Coerced Safely'
            }
        ];

        for (const test of testCases) {
            console.log(`🧪 Test: ${test.name}`);
            try {
                let response;
                if (test.rawBody) {
                    // Manual post for malformed JSON
                    try {
                        response = await axios({
                            method: test.method,
                            url: `${BASE_URL}${test.url}`,
                            data: test.rawBody,
                            headers: { ...config.headers, 'Content-Type': 'application/json' }
                        });
                    } catch (e) {
                        response = e.response;
                    }
                } else {
                    response = await axios[test.method](`${BASE_URL}${test.url}`, test.data || config, test.data ? config : undefined);
                }

                console.log(`   📡 Status: ${response?.status || 'No Response'}`);
                if (response?.status >= 500) {
                    console.log('   🔴 FALLO: El servidor devolvió 500 (Crush Interno)');
                } else if (response?.status >= 400) {
                    console.log(`   🟢 ÉXITO: El servidor rechazó correctamente la solicitud (${response.status})`);
                    console.log(`   📝 Mensaje: ${JSON.stringify(response.data.error || response.data)}`);
                } else {
                    console.log('   🟡 ADVERTENCIA: El servidor aceptó la solicitud (Verificar si hubo sanitización)');
                }
            } catch (error) {
                if (error.response) {
                    console.log(`   🟢 ÉXITO: El servidor rechazó correctamente (${error.response.status})`);
                } else {
                    console.log(`   ❓ Error de conexión/otro: ${error.message}`);
                }
            }
            console.log('');
        }

        console.log('🏁 Prueba de resiliencia completada.');

    } catch (error) {
        console.error('❌ Error crítico en el test:', error.message);
    }
}

runResilienceTest();
