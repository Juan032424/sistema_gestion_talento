const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function patchDatabaseV3() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        });

        console.log('Applying DISCOL S.A.S. 3.0 AI & Agents patch...');

        // Function to safely add a column
        const addColumn = async (table, column, definition) => {
            try {
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
                if (columns.length === 0) {
                    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                    console.log(`Added ${table}.${column}`);
                } else {
                    console.log(`Column ${table}.${column} already exists.`);
                }
            } catch (e) {
                console.error(`Error adding ${table}.${column}:`, e.message);
            }
        };

        // 1. Create Agent Logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                agent_name VARCHAR(100) NOT NULL,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(50), 
                entity_id INT,
                status ENUM('success', 'failed', 'pending') DEFAULT 'success',
                details TEXT,
                performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create Gamified Referral Portal table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS referidos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                referrer_name VARCHAR(150),
                referrer_email VARCHAR(150),
                candidate_name VARCHAR(150),
                candidate_contact VARCHAR(100),
                vacancy_id INT,
                status ENUM('Pending', 'In Review', 'Hired', 'Rejected') DEFAULT 'Pending',
                recruiter_points INT DEFAULT 0,
                recruiter_level VARCHAR(50) DEFAULT 'Junior',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vacancy_id) REFERENCES vacantes(id)
            )
        `);

        // 3. Update Vacantes table
        await addColumn('vacantes', 'costo_dia_vacante', 'DECIMAL(12,2) DEFAULT 0');
        await addColumn('vacantes', 'presupuesto_max', 'DECIMAL(12,2) DEFAULT 0');
        await addColumn('vacantes', 'salario_pactado', 'DECIMAL(12,2) DEFAULT 0');
        await addColumn('vacantes', 'dias_desfase', 'INT DEFAULT 0');
        await addColumn('vacantes', 'sla_meta', 'INT DEFAULT 15');

        // 4. Update Candidatos table (candidatos_seguimiento)
        await addColumn('candidatos_seguimiento', 'score_tecnico_ia', 'DECIMAL(5,2) DEFAULT 0');
        await addColumn('candidatos_seguimiento', 'resumen_ia_entrevista', 'TEXT');
        await addColumn('candidatos_seguimiento', 'audio_transcription', 'TEXT');
        await addColumn('candidatos_seguimiento', 'video_snap_url', 'VARCHAR(255)');
        await addColumn('candidatos_seguimiento', 'id_externo_linkedin', 'VARCHAR(255)');
        await addColumn('candidatos_seguimiento', 'matching_rank', 'INT DEFAULT 0');
        await addColumn('candidatos_seguimiento', 'offboarding_sentiment', 'VARCHAR(50)');
        await addColumn('candidatos_seguimiento', 'offboarding_reason', 'TEXT');

        console.log('AI & Agents patch completed successfully.');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

patchDatabaseV3();
