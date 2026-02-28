const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin(email, password) {
    let connection;
    try {
        console.log(`🔐 Probando login para: ${email} con pass: ${password}`);

        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        };

        connection = await mysql.createConnection(config);

        // 1. Buscar usuario
        const [rows] = await connection.query('SELECT * FROM candidatos WHERE email = ?', [email]);

        if (rows.length === 0) {
            console.log('❌ ERROR: Usuario no encontrado en la base de datos.');
            return;
        }

        const user = rows[0];
        console.log('✅ Usuario encontrado en BD.');
        console.log(`   ID: ${user.id}`);
        console.log(`   Hash guardado: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);

        if (!user.password_hash) {
            console.log('❌ ERROR: El usuario no tiene password_hash.');
            return;
        }

        // 2. Probar comparación
        console.log('🔄 Comparando contraseñas con bcrypt...');
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log('✅ SUCCESS: La contraseña coincide. El login debería funcionar.');
        } else {
            console.log('❌ FAIL: La contraseña NO coincide.');
            console.log('   Probando regenerar hash para ver diferencia...');
            const newHash = await bcrypt.hash(password, 10);
            console.log(`   Nuevo hash sería: ${newHash.substring(0, 20)}...`);
        }

    } catch (error) {
        console.error('❌ Error de conexión/query:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testLogin('demo@discol.com', 'Demo123!');
