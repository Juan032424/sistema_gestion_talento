const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function patchDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        });

        console.log('Applying Analytics and CV patch...');

        // 1. Update vacantes table
        try {
            await connection.query(`ALTER TABLE vacantes ADD COLUMN salario_base DECIMAL(12,2) DEFAULT 0`);
            console.log('Added vacantes.salario_base');
        } catch (e) { console.log('Notice: vacantes.salario_base already exists'); }

        // 2. Update candidatos_seguimiento table
        try {
            await connection.query(`ALTER TABLE candidatos_seguimiento ADD COLUMN cv_url VARCHAR(255)`);
            console.log('Added candidatos_seguimiento.cv_url');
        } catch (e) { console.log('Notice: candidatos_seguimiento.cv_url already exists'); }

        try {
            await connection.query(`ALTER TABLE candidatos_seguimiento ADD COLUMN fecha_postulacion DATE`);
            console.log('Added candidatos_seguimiento.fecha_postulacion');
        } catch (e) { console.log('Notice: candidatos_seguimiento.fecha_postulacion already exists'); }

        try {
            await connection.query(`ALTER TABLE candidatos_seguimiento ADD COLUMN fecha_contratacion DATE`);
            console.log('Added candidatos_seguimiento.fecha_contratacion');
        } catch (e) { console.log('Notice: candidatos_seguimiento.fecha_contratacion already exists'); }

        // 3. Create stages history table for bottleneck analysis
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS historial_etapas (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    vacante_id INT,
                    candidato_id INT,
                    etapa_nombre VARCHAR(100) NOT NULL,
                    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_fin TIMESTAMP NULL,
                    FOREIGN KEY (vacante_id) REFERENCES vacantes(id),
                    FOREIGN KEY (candidato_id) REFERENCES candidatos_seguimiento(id)
                )
            `);
            console.log('Created table historial_etapas');
        } catch (e) {
            console.error('Error creating historial_etapas table:', e);
        }

        console.log('Database patch completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error patching database:', error);
    }
}

patchDatabase();
