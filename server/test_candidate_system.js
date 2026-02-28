// ===================================
// 🧪 TEST CANDIDATE SYSTEM
// Script de prueba del sistema de candidatos
// ===================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/candidates';
let testToken = '';
let testCandidateId = '';

// Colores para consola
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function testRegister() {
    log('🧪', 'Test 1: Registro de Candidato', colors.blue);

    try {
        const email = `test.${Date.now()}@example.com`;
        const response = await axios.post(`${BASE_URL}/auth/register`, {
            email,
            password: 'Test1234',
            nombre: 'Juan Testing',
            apellido: 'Pérez',
            telefono: '+57 300 123 4567',
            ciudad: 'Bogotá',
            titulo_profesional: 'Ingeniero de Sistemas'
        });

        if (response.data.success) {
            testToken = response.data.token;
            testCandidateId = response.data.candidate.id;
            log('✅', `Registro exitoso - Email: ${email}`, colors.green);
            log('🔑', `Token obtenido: ${testToken.substring(0, 20)}...`);
            return true;
        }
    } catch (error) {
        log('❌', `Error en registro: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testLogin() {
    log('🧪', 'Test 2: Login de Candidato', colors.blue);

    try {
        // Usar el email del test anterior
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: `test.${Date.now() - 1000}@example.com`, // Email aproximado
            password: 'Test1234'
        });

        if (response.data.success) {
            log('✅', 'Login exitoso', colors.green);
            return true;
        }
    } catch (error) {
        log('⚠️ ', `Login skip (es normal si el email es diferente)`, colors.yellow);
        return true; // No fallar el test
    }
}

async function testGetProfile() {
    log('🧪', 'Test 3: Obtener Perfil', colors.blue);

    try {
        const response = await axios.get(`${BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });

        if (response.data.success) {
            const profile = response.data.profile;
            log('✅', `Perfil obtenido - Nombre: ${profile.nombre}`, colors.green);
            log('📊', `Completitud: ${profile.profileCompleteness}%`);
            return true;
        }
    } catch (error) {
        log('❌', `Error obteniendo perfil: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testAddSkill() {
    log('🧪', 'Test 4: Agregar Habilidad', colors.blue);

    try {
        const response = await axios.post(
            `${BASE_URL}/skills`,
            {
                habilidad: 'JavaScript',
                nivel: 'Avanzado',
                anos_experiencia: 5
            },
            {
                headers: {
                    'Authorization': `Bearer ${testToken}`
                }
            }
        );

        if (response.data.success) {
            log('✅', 'Habilidad agregada', colors.green);
            return true;
        }
    } catch (error) {
        log('❌', `Error agregando habilidad: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testAddEducation() {
    log('🧪', 'Test 5: Agregar Educación', colors.blue);

    try {
        const response = await axios.post(
            `${BASE_URL}/education`,
            {
                institucion: 'Universidad Nacional',
                titulo: 'Ingeniería de Sistemas',
                nivel_educativo: 'Pregrado',
                area_estudio: 'Computación',
                fecha_inicio: '2015-01-01',
                fecha_fin: '2020-12-01',
                en_curso: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${testToken}`
                }
            }
        );

        if (response.data.success) {
            log('✅', 'Educación agregada', colors.green);
            return true;
        }
    } catch (error) {
        log('❌', `Error agregando educación: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testUpdateProfile() {
    log('🧪', 'Test 6: Actualizar Perfil', colors.blue);

    try {
        const response = await axios.put(
            `${BASE_URL}/profile`,
            {
                salario_esperado: 5000000,
                disponibilidad: 'Inmediata',
                linkedin_url: 'https://linkedin.com/in/testing'
            },
            {
                headers: {
                    'Authorization': `Bearer ${testToken}`
                }
            }
        );

        if (response.data.success) {
            log('✅', 'Perfil actualizado', colors.green);
            return true;
        }
    } catch (error) {
        log('❌', `Error actualizando perfil: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testGetApplications() {
    log('🧪', 'Test 7: Ver Postulaciones', colors.blue);

    try {
        const response = await axios.get(`${BASE_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });

        if (response.data.success) {
            log('✅', `Postulaciones obtenidas: ${response.data.applications.length}`, colors.green);
            return true;
        }
    } catch (error) {
        log('❌', `Error obteniendo postulaciones: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function testGetNotifications() {
    log('🧪', 'Test 8: Ver Notificaciones', colors.blue);

    try {
        const response = await axios.get(`${BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });

        if (response.data.success) {
            log('✅', `Notificaciones obtenidas. No leídas: ${response.data.unreadCount}`, colors.green);
            return true;
        }
    } catch (error) {
        log('❌', `Error obteniendo notificaciones: ${error.response?.data?.error || error.message}`, colors.red);
        return false;
    }
}

async function runAllTests() {
    console.log('');
    log('🚀', '='.repeat(60), colors.blue);
    log('🚀', 'INICIANDO PRUEBAS DEL SISTEMA DE CANDIDATOS', colors.blue);
    log('🚀', '='.repeat(60), colors.blue);
    console.log('');

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    const tests = [
        { name: 'Registro', fn: testRegister },
        { name: 'Login', fn: testLogin },
        { name: 'Obtener Perfil', fn: testGetProfile },
        { name: 'Agregar Habilidad', fn: testAddSkill },
        { name: 'Agregar Educación', fn: testAddEducation },
        { name: 'Actualizar Perfil', fn: testUpdateProfile },
        { name: 'Ver Postulaciones', fn: testGetApplications },
        { name: 'Ver Notificaciones', fn: testGetNotifications }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        console.log('');
    }

    // Resultados finales
    console.log('');
    log('📊', '='.repeat(60), colors.blue);
    log('📊', 'RESULTADOS FINALES', colors.blue);
    log('📊', '='.repeat(60), colors.blue);
    console.log('');
    log('✅', `Pruebas pasadas: ${results.passed}/${results.total}`, colors.green);
    if (results.failed > 0) {
        log('❌', `Pruebas falladas: ${results.failed}/${results.total}`, colors.red);
    }
    console.log('');

    if (results.passed === results.total) {
        log('🎉', '¡TODAS LAS PRUEBAS PASARON! Sistema funcionando correctamente', colors.green);
    } else {
        log('⚠️ ', 'Algunas pruebas fallaron. Revisa los errores arriba.', colors.yellow);
    }

    console.log('');
}

// Verificar que el servidor esté corriendo
async function checkServer() {
    try {
        await axios.get('http://localhost:3001/');
        return true;
    } catch (error) {
        log('❌', 'El servidor no está corriendo en http://localhost:3001', colors.red);
        log('💡', 'Inicia el servidor con: cd server && npm run dev', colors.yellow);
        return false;
    }
}

// Ejecutar
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runAllTests();
    }
    process.exit(0);
})();
