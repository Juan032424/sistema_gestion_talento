const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function seedDelayedVacancies() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        });

        console.log('Seeding delayed vacancies for Analyst Agent test...');

        // Check if table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'vacantes'");
        if (tables.length === 0) {
            console.error('Table vacantes does not exist.');
            return;
        }

        const [existing] = await connection.query('SELECT id FROM procesos LIMIT 1');
        const [existingSede] = await connection.query('SELECT id FROM sedes LIMIT 1');

        if (existing.length === 0 || existingSede.length === 0) {
            console.error('Procesos or Sedes tables are empty. Cannot seed vacantes.');
            return;
        }

        const procesoId = existing[0].id;
        const sedeId = existingSede[0].id;

        // Add a vacancy that has been open for 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        await connection.query(`
            INSERT INTO vacantes 
            (codigo_requisicion, puesto_nombre, proceso_id, sede_id, fecha_apertura, estado, presupuesto_max, costo_dia_vacante, sla_meta)
            VALUES 
            ('DLY-002', 'Delayed Engineer', ?, ?, ?, 'Abierta', 8000000, 250000, 15)
        `, [procesoId, sedeId, dateStr]);

        console.log('Seed completed successfully.');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seedDelayedVacancies();
