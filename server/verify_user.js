const pool = require('./db');
require('dotenv').config();

async function verifyUser(email) {
    try {
        console.log(`\n🔍 Verificando usuario: ${email}\n`);

        // Check LEGACY table (candidatos)
        const [legacyUsers] = await pool.query(
            'SELECT id, nombre, email, password_hash FROM candidatos WHERE email = ?',
            [email]
        );

        console.log('═══════════════════════════════════════');
        console.log('📋 TABLA LEGACY (candidatos):');
        console.log('═══════════════════════════════════════');
        if (legacyUsers.length > 0) {
            const user = legacyUsers[0];
            console.log('✅ Usuario ENCONTRADO en sistema Legacy');
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Nombre: ${user.nombre}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Tiene password: ${user.password_hash ? 'SÍ ✓' : 'NO ✗'}`);
            if (user.password_hash) {
                console.log(`   - Hash: ${user.password_hash.substring(0, 20)}...`);
            }
        } else {
            console.log('❌ Usuario NO encontrado en sistema Legacy');
        }

        console.log('\n═══════════════════════════════════════');
        console.log('📋 TABLA NUEVA (candidate_accounts):');
        console.log('═══════════════════════════════════════');

        // Check NEW table (candidate_accounts)
        const [newUsers] = await pool.query(
            'SELECT id, nombre, email, password_hash, estado FROM candidate_accounts WHERE email = ?',
            [email]
        );

        if (newUsers.length > 0) {
            const user = newUsers[0];
            console.log('✅ Usuario ENCONTRADO en sistema Nuevo');
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Nombre: ${user.nombre}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Estado: ${user.estado}`);
            console.log(`   - Tiene password: ${user.password_hash ? 'SÍ ✓' : 'NO ✗'}`);
            if (user.password_hash) {
                console.log(`   - Hash: ${user.password_hash.substring(0, 20)}...`);
            }
        } else {
            console.log('❌ Usuario NO encontrado en sistema Nuevo');
        }

        console.log('\n═══════════════════════════════════════');
        console.log('📊 RESUMEN:');
        console.log('═══════════════════════════════════════');

        if (legacyUsers.length === 0 && newUsers.length === 0) {
            console.log('❌ Este email NO está registrado en ninguna base de datos.');
            console.log('   👉 Necesitas REGISTRARTE primero o usar otro email.');
        } else {
            console.log('✅ El email existe en la base de datos.');
            if ((legacyUsers[0] && !legacyUsers[0].password_hash) ||
                (newUsers[0] && !newUsers[0].password_hash)) {
                console.log('⚠️  PROBLEMA: El usuario no tiene contraseña configurada.');
            }
        }

        console.log('═══════════════════════════════════════\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando usuario:', error);
        process.exit(1);
    }
}

const email = process.argv[2] || 'ces.er@outlook.com';
verifyUser(email);
