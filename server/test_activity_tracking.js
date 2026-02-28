/**
 * Script de Prueba - Genera Datos de Ejemplo para el Sistema de Tracking
 * 
 * CÓMO USAR:
 * 1. Ejecutar: node test_activity_tracking.js
 * 2. Ir al portal administrativo
 * 3. Navegar a Candidatos > Editar (cualquier candidato)
 * 4. Scroll hacia abajo para ver "Actividad en Portal Público"
 */

const pool = require('./db');

async function testActivityTracking() {
    console.log('\n🚀 Iniciando prueba del sistema de tracking de candidatos...\n');

    try {
        // 1. Verificar que existe la tabla de logs
        console.log('📋 Verificando tabla candidate_activity_logs...');
        const [tables] = await pool.query(`
            SHOW TABLES LIKE 'candidate_activity_logs'
        `);

        if (tables.length === 0) {
            console.log('❌ ERROR: La tabla candidate_activity_logs no existe.');
            console.log('💡 Ejecuta primero: node migrations/create_activity_logs.js\n');
            process.exit(1);
        }
        console.log('✅ Tabla encontrada\n');

        // 2. Verificar si existe al menos un candidato con cuenta
        console.log('👤 Buscando candidatos con cuenta en el portal...');
        const [candidates] = await pool.query(`
            SELECT id, nombre, email FROM candidate_accounts LIMIT 1
        `);

        if (candidates.length === 0) {
            console.log('⚠️  No hay candidatos registrados en el portal público.');
            console.log('💡 Para crear datos de prueba:');
            console.log('   1. Ve a http://localhost:5173/portal');
            console.log('   2. Haz clic en "Registro" (arriba derecha)');
            console.log('   3. Crea una cuenta de prueba');
            console.log('   4. Navega por algunas vacantes');
            console.log('   5. Vuelve a ejecutar este script\n');
            process.exit(0);
        }

        const testCandidate = candidates[0];
        console.log(`✅ Candidato de prueba: ${testCandidate.nombre} (ID: ${testCandidate.id})\n`);

        // 3. Buscar una vacante activa
        console.log('📝 Buscando vacante activa...');
        const [vacancies] = await pool.query(`
            SELECT id, puesto_nombre FROM vacantes WHERE estado = 'Abierta' LIMIT 1
        `);

        if (vacancies.length === 0) {
            console.log('⚠️  No hay vacantes abiertas. Crea una vacante primero.\n');
            process.exit(0);
        }

        const testVacancy = vacancies[0];
        console.log(`✅ Vacante de prueba: ${testVacancy.puesto_nombre} (ID: ${testVacancy.id})\n`);

        // 4. Generar logs de actividad de ejemplo
        console.log('📊 Generando logs de actividad de ejemplo...\n');

        const activities = [
            {
                type: 'LOGIN',
                desc: 'Inició sesión en el portal público',
                related: null
            },
            {
                type: 'VIEW_JOB',
                desc: `Visualizó los detalles de la vacante ID ${testVacancy.id}`,
                related: testVacancy.id
            },
            {
                type: 'START_APPLICATION',
                desc: `Inició el proceso de postulación para la vacante ID ${testVacancy.id}`,
                related: testVacancy.id
            },
            {
                type: 'ABANDON_APPLICATION',
                desc: `Abandonó el formulario de postulación para la vacante ID ${testVacancy.id}`,
                related: testVacancy.id
            },
            {
                type: 'VIEW_JOB',
                desc: `Visualizó los detalles de la vacante ID ${testVacancy.id}`,
                related: testVacancy.id
            },
            {
                type: 'SAVE_JOB',
                desc: `Guardó la vacante ID ${testVacancy.id}`,
                related: testVacancy.id
            }
        ];

        for (const activity of activities) {
            await pool.query(`
                INSERT INTO candidate_activity_logs 
                (candidate_id, activity_type, description, related_id, metadata)
                VALUES (?, ?, ?, ?, ?)
            `, [
                testCandidate.id,
                activity.type,
                activity.desc,
                activity.related,
                JSON.stringify({})
            ]);
            console.log(`   ✓ ${activity.type}: ${activity.desc}`);
        }

        console.log('\n✅ Logs creados exitosamente!\n');

        // 5. Verificar los logs
        console.log('🔍 Verificando logs insertados...');
        const [logs] = await pool.query(`
            SELECT activity_type, description, created_at 
            FROM candidate_activity_logs 
            WHERE candidate_id = ? 
            ORDER BY created_at DESC
        `, [testCandidate.id]);

        console.log(`\n📋 Total de logs para ${testCandidate.nombre}: ${logs.length}\n`);

        // 6. Instrucciones para ver en la UI
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 CÓMO VER LOS DATOS EN LA INTERFAZ:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('1. Ve al panel administrativo (http://localhost:5173)');
        console.log('2. Navega a la sección "Candidatos"');
        console.log('3. Busca un candidato que tenga email:', testCandidate.email);
        console.log('4. Haz clic en el botón "Editar" (ícono de lápiz)');
        console.log('5. Scroll hacia ABAJO hasta el final del formulario');
        console.log('6. Deberías ver la sección "Actividad en Portal Público"');
        console.log('7. Haz clic en "Generar Análisis IA" para ver el insight\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 PARA VER HOT VACANCIES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('1. Ve al panel administrativo');
        console.log('2. Navega a la sección "Analytics"');
        console.log('3. Scroll hacia abajo');
        console.log('4. Verás el ranking de "Vacantes Hot"\n');

        console.log('✨ ¡Listo! El sistema está funcionando.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

testActivityTracking();
