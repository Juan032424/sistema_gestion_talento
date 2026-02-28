const pool = require('./db');

async function createApplicationTables() {
    console.log('Creating Application System tables...\n');

    const tables = [
       
        `CREATE TABLE IF NOT EXISTS applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vacante_id INT NOT NULL,
            candidato_id INT NULL,
            nombre VARCHAR(255),
            email VARCHAR(255),
            telefono VARCHAR(50),
            cv_url VARCHAR(500),
            auto_match_score INT DEFAULT 0,
            recruiter_rating INT DEFAULT 0,
            estado ENUM('Nueva', 'En Revisión', 'Preseleccionado', 'Entrevista', 'Oferta', 'Contratado', 'Rechazado') DEFAULT 'Nueva',
            carta_presentacion TEXT,
            experiencia_anos INT,
            salario_esperado DECIMAL(12,2),
            disponibilidad VARCHAR(100),
            notas_reclutador TEXT,
            fecha_postulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            vista_por_reclutador BOOLEAN DEFAULT FALSE,
            fecha_vista DATETIME NULL,
            INDEX idx_vacante (vacante_id),
            INDEX idx_candidato (candidato_id),
            INDEX idx_estado (estado),
            INDEX idx_score (auto_match_score),
            INDEX idx_fecha (fecha_postulacion)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

        
        `CREATE TABLE IF NOT EXISTS external_candidates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            telefono VARCHAR(50),
            ubicacion VARCHAR(255),
            titulo_profesional VARCHAR(255),
            experiencia_total_anos INT,
            nivel_educacion VARCHAR(100),
            habilidades_tecnicas TEXT,
            idiomas TEXT,
            certificaciones TEXT,
            areas_interes TEXT,
            tipo_empleo_buscado VARCHAR(100),
            disponibilidad_viajar BOOLEAN DEFAULT FALSE,
            trabajo_remoto_preferido BOOLEAN DEFAULT FALSE,
            cv_url VARCHAR(500),
            linkedin_url VARCHAR(500),
            portfolio_url VARCHAR(500),
            fuente VARCHAR(100),
            registro_completo BOOLEAN DEFAULT FALSE,
            acepta_terminos BOOLEAN DEFAULT TRUE,
            acepta_comunicaciones BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_registro_completo (registro_completo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

        // 3. Public job postings
        `CREATE TABLE IF NOT EXISTS public_job_postings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vacante_id INT NOT NULL UNIQUE,
            is_public BOOLEAN DEFAULT TRUE,
            is_featured BOOLEAN DEFAULT FALSE,
            slug VARCHAR(255) UNIQUE,
            meta_description TEXT,
            keywords TEXT,
            views_count INT DEFAULT 0,
            applications_count INT DEFAULT 0,
            shares_count INT DEFAULT 0,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NULL,
            INDEX idx_slug (slug),
            INDEX idx_public (is_public),
            INDEX idx_featured (is_featured)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

        // 4. Notifications
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_type ENUM('candidato', 'reclutador', 'admin') NOT NULL,
            user_id INT NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            mensaje TEXT,
            related_entity VARCHAR(50),
            related_id INT,
            leida BOOLEAN DEFAULT FALSE,
            fecha_leida DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_type, user_id),
            INDEX idx_leida (leida),
            INDEX idx_fecha (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

        // 5. Auto matches
        `CREATE TABLE IF NOT EXISTS auto_matches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vacante_id INT NOT NULL,
            candidato_id INT,
            external_candidate_id INT,
            match_score INT NOT NULL,
            match_reasoning TEXT,
            skills_match_score INT,
            experience_match_score INT,
            education_match_score INT,
            location_match_score INT,
            notificado BOOLEAN DEFAULT FALSE,
            visto_por_candidato BOOLEAN DEFAULT FALSE,
            aplicado BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_vacante (vacante_id),
            INDEX idx_candidato (candidato_id),
            INDEX idx_score (match_score)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];

    try {
        for (let i = 0; i < tables.length; i++) {
            await pool.query(tables[i]);
            console.log(`✅ Table ${i + 1}/5 created`);
        }

        console.log('\n✅ All tables created successfully!');

        // Create public postings for existing vacancies
        console.log('\nCreating public postings for existing vacancies...');
        const [result] = await pool.query(`
            INSERT INTO public_job_postings (vacante_id, slug, is_public)
            SELECT 
                id,
                LOWER(CONCAT(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(puesto_nombre, ' ', '-'), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'),
                    '-',
                    id
                )),
                FALSE
            FROM vacantes
            WHERE estado = 'Abierta'
            AND id NOT IN (SELECT vacante_id FROM public_job_postings)
        `);

        console.log(`✅ Created ${result.affectedRows} public postings`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

createApplicationTables();
