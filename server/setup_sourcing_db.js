const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createSourcingTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        });

        console.log('🚀 Creating AI Sourcing tables...');

        // Table 1: sourcing_campaigns
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sourcing_campaigns (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vacante_id INT,
                nombre VARCHAR(255) NOT NULL,
                estado ENUM('active', 'paused', 'completed') DEFAULT 'active',
                fuentes_activas JSON,
                filtros JSON,
                candidatos_encontrados INT DEFAULT 0,
                candidatos_contactados INT DEFAULT 0,
                tasa_respuesta DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ultima_ejecucion TIMESTAMP NULL,
                FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
                INDEX idx_estado (estado),
                INDEX idx_vacante (vacante_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table sourcing_campaigns created');

        // Table 2: sourced_candidates
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sourced_candidates (
                id INT PRIMARY KEY AUTO_INCREMENT,
                campaign_id INT NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                telefono VARCHAR(50),
                fuente ENUM('linkedin', 'indeed', 'computrabajo', 'elempleo', 'magneto', 'other') NOT NULL,
                perfil_url TEXT,
                cv_text TEXT,
                ai_match_score DECIMAL(5,2) DEFAULT 0,
                ai_analysis JSON,
                estado ENUM('new', 'contacted', 'responded', 'interviewing', 'rejected', 'hired') DEFAULT 'new',
                fecha_descubrimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_contacto TIMESTAMP NULL,
                notas TEXT,
                FOREIGN KEY (campaign_id) REFERENCES sourcing_campaigns(id) ON DELETE CASCADE,
                UNIQUE KEY unique_email_campaign (email, campaign_id),
                INDEX idx_score (ai_match_score),
                INDEX idx_estado (estado),
                INDEX idx_fuente (fuente)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table sourced_candidates created');

        // Table 3: campaign_executions (optional log table)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS campaign_executions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                campaign_id INT NOT NULL,
                total_searched INT DEFAULT 0,
                candidates_saved INT DEFAULT 0,
                avg_score DECIMAL(5,2) DEFAULT 0,
                sources_used JSON,
                execution_time_ms INT,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES sourcing_campaigns(id) ON DELETE CASCADE,
                INDEX idx_campaign (campaign_id),
                INDEX idx_executed_at (executed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table campaign_executions created');

        // Table 4: job_board_sources (configuration)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS job_board_sources (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                enabled BOOLEAN DEFAULT TRUE,
                priority INT DEFAULT 5,
                rate_limit_ms INT DEFAULT 1000,
                last_used TIMESTAMP NULL,
                total_candidates_found INT DEFAULT 0,
                avg_match_score DECIMAL(5,2) DEFAULT 0,
                config JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_enabled (enabled),
                INDEX idx_priority (priority)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table job_board_sources created');

        // Seed job board sources
        await connection.query(`
            INSERT IGNORE INTO job_board_sources (nombre, enabled, priority, rate_limit_ms, config) VALUES
            ('LinkedIn', TRUE, 1, 2000, '{"api_key": null, "scraping_enabled": true}'),
            ('Indeed', TRUE, 2, 1500, '{"api_key": null, "scraping_enabled": true}'),
            ('Computrabajo', TRUE, 3, 1000, '{"region": "CO", "scraping_enabled": true}'),
            ('ElEmpleo', TRUE, 4, 1000, '{"region": "CO", "scraping_enabled": true}'),
            ('Magneto365', TRUE, 5, 1200, '{"region": "LATAM", "scraping_enabled": true}');
        `);
        console.log('✅ Job board sources seeded');

        console.log('\n🎉 AI Sourcing database setup completed successfully!\n');

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// Run if executed directly
if (require.main === module) {
    createSourcingTables()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = createSourcingTables;
