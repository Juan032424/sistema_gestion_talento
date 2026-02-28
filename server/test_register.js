const candidateAuthService = require('./services/CandidateAuthService');
const pool = require('./db');
require('dotenv').config();

async function testRegister() {
    try {
        console.log('🧹 Limpiando usuario de prueba previo...');
        await pool.query('DELETE FROM candidatos WHERE email = ?', ['test_reg_3@example.com']);
        /* Borrar también el intento fallido anterior test_reg_2 */
        await pool.query('DELETE FROM candidatos WHERE email = ?', ['test_reg_2@example.com']);

        console.log('🧪 Probando registro de candidato (Intento 3)...');
        const data = {
            nombre: 'Test User 3',
            email: 'test_reg_3@example.com',
            telefono: '3001234567',
            password: 'Password123!',
            ciudad: 'Bogotá',
            titulo_profesional: 'Ingeniero de Prueba'
        };

        console.log('📦 Datos a enviar:', data);

        const result = await candidateAuthService.register(data);
        console.log('✅ Registro exitoso:', result);
        console.log('🔑 Token generado:', result.token ? 'SÍ' : 'NO');

        // Limpiar después de éxito
        await pool.query('DELETE FROM candidatos WHERE email = ?', [data.email]);
        console.log('🧹 Usuario de prueba eliminado tras éxito.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en registro:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

testRegister();
