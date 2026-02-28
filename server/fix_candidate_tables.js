// Script URGENTE para recrear todas las tablas correctamente
const mysql = require('mysql2/promise');
require('dotenv').config();

async function recreateTables() {
    let connection;

    try {
        console.log('🔌 Conectando a la base de datos...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento',
            multipleStatements: true
        });

        console.log('✅ Conectado');
        console.log('');

        // IMPORTANTE: Deshabilitar foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('🗑️  Eliminando tablas existentes...');

        await connection.query('DROP TABLE IF EXISTS candidate_notifications');
        console.log('   ✓ candidate_notifications');

        await connection.query('DROP TABLE IF EXISTS candidate_saved_jobs');
        console.log('   ✓ candidate_saved_jobs');

        await connection.query('DROP TABLE IF EXISTS candidate_activity_log');
        console.log('   ✓ candidate_activity_log');

        await connection.query('DROP TABLE IF EXISTS candidate_languages');
        console.log('   ✓ candidate_languages');

        await connection.query('DROP TABLE IF EXISTS candidate_experience');
        console.log('   ✓ candidate_experience');

        await connection.query('DROP TABLE IF EXISTS candidate_education');
        console.log('   ✓ candidate_education');

        await connection.query('DROP TABLE IF EXISTS candidate_skills');
        console.log('   ✓ candidate_skills');

        await connection.query('DROP TABLE IF EXISTS candidate_accounts');
        console.log('   ✓ candidate_accounts');

        console.log('');
        console.log('📦 Creando tablas nuevas...');

        // 1. candidate_accounts
        await connection.query(`
            CREATE TABLE candidate_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                email_verification_token VARCHAR(255),
                email_verification_expires DATETIME,
                reset_token VARCHAR(255),
                reset_token_expires DATETIME,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                telefono VARCHAR(50),
                fecha_nacimiento DATE,
                genero ENUM('Masculino', 'Femenino', 'Otro', 'Prefiero no decir'),
                titulo_profesional VARCHAR(255),
                experiencia_total_anos INT DEFAULT 0,
                salario_esperado DECIMAL(12,2),
                disponibilidad ENUM('Inmediata', '15 días', '30 días', '2 meses', 'No disponible') DEFAULT 'Inmediata',
                linkedin_url VARCHAR(500),
                portfolio_url VARCHAR(500),
                github_url VARCHAR(500),
                cv_url TEXT,
                cv_filename VARCHAR(255),
                cv_uploaded_at DATETIME,
                foto_perfil_url TEXT,
                permite_notificaciones BOOLEAN DEFAULT TRUE,
                permite_marketing BOOLEAN DEFAULT FALSE,
                busqueda_activa BOOLEAN DEFAULT TRUE,
                ciudad VARCHAR(100),
                departamento VARCHAR(100),
                pais VARCHAR(100) DEFAULT 'Colombia',
                estado ENUM('Activa', 'Inactiva', 'Suspendida', 'Eliminada') DEFAULT 'Activa',
                ultima_actividad DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_estado (estado)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_accounts');

        // 2. candidate_skills
        await connection.query(`
            CREATE TABLE candidate_skills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                habilidad VARCHAR(100) NOT NULL,
                nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Experto') DEFAULT 'Intermedio',
                anos_experiencia INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_skills');

        // 3. candidate_education
        await connection.query(`
            CREATE TABLE candidate_education (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                institucion VARCHAR(255) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                nivel_educativo ENUM('Bachillerato', 'Técnico', 'Tecnólogo', 'Pregrado', 'Especialización', 'Maestría', 'Doctorado') NOT NULL,
                area_estudio VARCHAR(255),
                fecha_inicio DATE,
                fecha_fin DATE,
                en_curso BOOLEAN DEFAULT FALSE,
                descripcion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_education');

        // 4. candidate_experience
        await connection.query(`
            CREATE TABLE candidate_experience (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                empresa VARCHAR(255) NOT NULL,
                cargo VARCHAR(255) NOT NULL,
                tipo_empleo ENUM('Tiempo Completo', 'Medio Tiempo', 'Contrato', 'Freelance', 'Pasantía') DEFAULT 'Tiempo Completo',
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE,
                trabajo_actual BOOLEAN DEFAULT FALSE,
                descripcion TEXT,
                logros TEXT,
                ciudad VARCHAR(100),
                pais VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_experience');

        // 5. candidate_languages
        await connection.query(`
            CREATE TABLE candidate_languages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                idioma VARCHAR(50) NOT NULL,
                nivel ENUM('Básico', 'Intermedio', 'Avanzado', 'Nativo') DEFAULT 'Intermedio',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_languages');

        // 6. candidate_activity_log
        await connection.query(`
            CREATE TABLE candidate_activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                accion VARCHAR(100) NOT NULL,
                descripcion TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id),
                INDEX idx_accion (accion)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_activity_log');

        // 7. candidate_saved_jobs
        await connection.query(`
            CREATE TABLE candidate_saved_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                vacante_id INT NOT NULL,
                notas TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                UNIQUE KEY unique_save (candidate_account_id, vacante_id),
                INDEX idx_candidate (candidate_account_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_saved_jobs');

        // 8. candidate_notifications
        await connection.query(`
            CREATE TABLE candidate_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_account_id INT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                leida BOOLEAN DEFAULT FALSE,
                fecha_leida DATETIME,
                link_accion VARCHAR(500),
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
                INDEX idx_candidate (candidate_account_id),
                INDEX idx_leida (leida)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✓ candidate_notifications');

        // Reactivar foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('');
        console.log('✅ ¡TODAS LAS TABLAS CREADAS EXITOSAMENTE!');
        console.log('');
        console.log('🎉 Sistema listo para usar');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

recreateTables();
