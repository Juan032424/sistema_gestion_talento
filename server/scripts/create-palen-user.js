const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSpecificUser() {
    let connection;
    try {
        console.log('👤 Creando usuario palen24@outlook.com...');

        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        };

        connection = await mysql.createConnection(config);

        // Hash password
        const password = '123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar o Actualizar
        await connection.query(`
            INSERT INTO candidatos (
                nombre, email, telefono, password_hash, ciudad, titulo_profesional, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                updated_at = NOW()
        `, [
            'Usuario Palen',
            'palen24@outlook.com',
            '+57 300 000 0000',
            hashedPassword,
            'Bogotá',
            'Profesional'
        ]);

        console.log('✅ Usuario creado exitosamente.');
        console.log('📧 Email: palen24@outlook.com');
        console.log('🔑 Pass: 123'); // Le puse 123 para que sea fácil

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

createSpecificUser();
