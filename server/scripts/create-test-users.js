/**
 * Script para crear usuarios de prueba con contraseñas hasheadas
 * Ejecutar: node create-test-users.js
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const users = [
    {
        nombre: 'Usuario Demo',
        email: 'demo@discol.com',
        telefono: '+57 300 123 4567',
        password: 'Demo123!',
        ciudad: 'Bogotá',
        titulo_profesional: 'Desarrollador Full Stack'
    },
    {
        nombre: 'Usuario Test',
        email: 'test@discol.com',
        telefono: '+57 301 234 5678',
        password: 'Test123!',
        ciudad: 'Medellín',
        titulo_profesional: 'Ingeniero de Software'
    },
    {
        nombre: 'María García',
        email: 'maria@discol.com',
        telefono: '+57 302 345 6789',
        password: 'Maria123!',
        ciudad: 'Cali',
        titulo_profesional: 'Diseñadora UX/UI'
    }
];

async function createTestUsers() {
    let connection;

    try {
        console.log('🔌 Conectando a la base de datos...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'discol_rrhh'
        });

        console.log('✅ Conexión establecida\n');

        // Verificar que la tabla tiene password_hash
        console.log('🔍 Verificando estructura de la tabla candidatos...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'candidatos' 
              AND COLUMN_NAME IN ('password_hash', 'ciudad', 'titulo_profesional')
        `);

        const columnNames = columns.map(c => c.COLUMN_NAME);
        console.log('Columnas encontradas:', columnNames);

        if (!columnNames.includes('password_hash')) {
            console.error('❌ ERROR: La columna password_hash no existe en la tabla candidatos');
            console.error('   Ejecuta primero: server/migrations/add_candidate_auth_tables.sql');
            process.exit(1);
        }

        console.log('✅ Estructura de tabla correcta\n');

        // Crear usuarios
        for (const user of users) {
            console.log(`👤 Creando usuario: ${user.email}...`);

            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            console.log(`   🔐 Hash generado: ${hashedPassword.substring(0, 30)}...`);

            try {
                // Intentar insertar
                const [result] = await connection.query(`
                    INSERT INTO candidatos (
                        nombre, email, telefono, password_hash, 
                        ciudad, titulo_profesional, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        nombre = VALUES(nombre),
                        telefono = VALUES(telefono),
                        password_hash = VALUES(password_hash),
                        ciudad = VALUES(ciudad),
                        titulo_profesional = VALUES(titulo_profesional),
                        updated_at = NOW()
                `, [
                    user.nombre,
                    user.email,
                    user.telefono,
                    hashedPassword,
                    user.ciudad,
                    user.titulo_profesional
                ]);

                if (result.affectedRows > 0) {
                    console.log(`   ✅ Usuario ${user.email} creado/actualizado exitosamente`);
                }
            } catch (error) {
                console.error(`   ❌ Error creando ${user.email}:`, error.message);
            }

            console.log('');
        }

        // Verificar usuarios creados
        console.log('📋 Verificando usuarios creados:\n');
        const [createdUsers] = await connection.query(`
            SELECT 
                id,
                nombre,
                email,
                telefono,
                ciudad,
                titulo_profesional,
                CASE 
                    WHEN password_hash IS NOT NULL THEN '✓ Sí'
                    ELSE '✗ No'
                END as tiene_password,
                created_at
            FROM candidatos
            WHERE email IN (?, ?, ?)
        `, users.map(u => u.email));

        console.table(createdUsers);

        console.log('\n✅ Proceso completado exitosamente\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📝 CREDENCIALES DE PRUEBA PARA LOGIN:');
        console.log('═══════════════════════════════════════════════════════');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.nombre}`);
            console.log(`   Email:    ${user.email}`);
            console.log(`   Password: ${user.password}`);
        });
        console.log('\n═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
createTestUsers();
