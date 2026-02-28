const pool = require('../db');

async function runMigrationStepByStep() {
    try {
        console.log('🚀 Migración 003: Sistema de autenticación para candidatos\n');

        // PASO 1: Agregar columnas de autenticación
        console.log('PASO 1: Agregar campos de autenticación...');
        const authColumns = [
            { name: 'password_hash', type: 'VARCHAR(255) NULL' },
            { name: 'has_account', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'verification_token', type: 'VARCHAR(255) NULL' },
            { name: 'reset_token', type: 'VARCHAR(255) NULL' },
            { name: 'reset_token_expires', type: 'DATETIME NULL' },
            { name: 'last_login', type: 'DATETIME NULL' },
            { name: 'profile_completed', type: 'BOOLEAN DEFAULT FALSE' }
        ];

        for (const col of authColumns) {
            try {
                await pool.query(`ALTER TABLE external_candidates ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✅ ${col.name}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) {
                    console.log(`  ⚠️  ${col.name} (ya existe)`);
                }
            }
        }

        // PASO 2: Agregar campos de perfil
        console.log('\nPASO 2: Agregar campos de perfil completo...');
        const profileColumns = [
            { name: 'ciudad', type: 'VARCHAR(100) NULL' },
            { name: 'direccion', type: 'TEXT NULL' },
            { name: 'fecha_nacimiento', type: 'DATE NULL' },
            { name: 'genero', type: 'VARCHAR(20) NULL' },
            { name: 'nivel_estudios', type: 'VARCHAR(100) NULL' },
            { name: 'universidad', type: 'VARCHAR(255) NULL' },
            { name: 'carrera', type: 'VARCHAR(255) NULL' },
            { name: 'biografia', type: 'TEXT NULL' },
            { name: 'portafolio_url', type: 'VARCHAR(500) NULL' },
            { name: 'github_url', type: 'VARCHAR(500) NULL' },
            { name: 'behance_url', type: 'VARCHAR(500) NULL' },
            { name: 'disponibilidad_viajar', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'disponibilidad_cambio_residencia', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'preferencia_modalidad', type: 'VARCHAR(50) NULL' }
        ];

        for (const col of profileColumns) {
            try {
                await pool.query(`ALTER TABLE external_candidates ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✅ ${col.name}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) {
                    console.log(`  ⚠️  ${col.name} (ya existe)`);
                }
            }
        }

        // PASO 3: Crear tabla de tracking links
        console.log('\nPASO 3: Crear tabla de tracking links...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS application_tracking_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                tracking_token VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                views_count INT DEFAULT 0,
                last_viewed_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_tracking_token (tracking_token),
                INDEX idx_email (email),
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ application_tracking_links');

        // PASO 4: Crear tabla de notificaciones
        console.log('\nPASO 4: Crear tabla de notificaciones...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                external_candidate_id INT NULL,
                email VARCHAR(255) NOT NULL,
                application_id INT NULL,
                tipo VARCHAR(50) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                read_at DATETIME NULL,
                action_url VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_is_read (is_read),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ candidate_notifications');

        // PASO 5: Crear tabla de documentos
        console.log('\nPASO 5: Crear tabla de documentos...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                external_candidate_id INT NOT NULL,
                application_id INT NULL,
                document_type VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_url TEXT NOT NULL,
                file_size INT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_candidate (external_candidate_id),
                INDEX idx_type (document_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ candidate_documents');

        // PASO 6: Crear tabla de habilidades
        console.log('\nPASO 6: Crear tabla de habilidades...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_skills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                external_candidate_id INT NOT NULL,
                skill_name VARCHAR(100) NOT NULL,
                proficiency_level VARCHAR(50) DEFAULT 'Intermedio',
                years_experience INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_candidate (external_candidate_id),
                INDEX idx_skill (skill_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ candidate_skills');

        // PASO 7: Crear tabla de idiomas
        console.log('\nPASO 7: Crear tabla de idiomas...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_languages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                external_candidate_id INT NOT NULL,
                language_name VARCHAR(50) NOT NULL,
                proficiency_level VARCHAR(50) DEFAULT 'Intermedio',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_candidate (external_candidate_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ candidate_languages');

        // PASO 8: Agregar campos de tracking a applications
        console.log('\nPASO 8: Campos de tracking en applications...');
        const trackingColumns = [
            { name: 'tracking_link_sent', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'candidate_viewed_at', type: 'DATETIME NULL' },
            { name: 'candidate_notes', type: 'TEXT NULL' },
            { name: 'rating_by_candidate', type: 'INT NULL' },
            { name: 'feedback_by_candidate', type: 'TEXT NULL' }
        ];

        for (const col of trackingColumns) {
            try {
                await pool.query(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✅ ${col.name}`);
            } catch (e) {
                if (!e.message.includes('Duplicate column')) {
                    console.log(`  ⚠️  ${col.name} (ya existe)`);
                }
            }
        }

        // VERIFICACIÓN FINAL
        console.log('\n📊 VERIFICACIÓN:');
        const [tables] = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name IN (
                'application_tracking_links',
                'candidate_notifications',
                'candidate_documents',
                'candidate_skills',
                'candidate_languages'
            )
        `);

        console.log(`\n✅ Tablas creadas (${tables.length}/5):`);
        tables.forEach(t => console.log(`   - ${t.table_name}`));

        console.log('\n✅ Migración 003 completada exitosamente!');
        console.log('🎉 Sistema de autenticación de candidatos listo!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        process.exit(0);
    }
}

runMigrationStepByStep();
