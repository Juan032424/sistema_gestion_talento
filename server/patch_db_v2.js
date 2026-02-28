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

        console.log('Applying patches to database...');

        // 1. Update vacantes table
        try {
            await connection.query(`ALTER TABLE vacantes MODIFY COLUMN estado ENUM('Abierta', 'En Proceso', 'Cubierta', 'Cancelada', 'Suspendida') DEFAULT 'Abierta'`);
            console.log('Updated vacantes.estado ENUM');
        } catch (e) { console.log('Notice: vacantes.estado modification skipped or already applied'); }

        try {
            await connection.query(`ALTER TABLE vacantes ADD COLUMN costo_vacante DECIMAL(12,2) DEFAULT 0`);
            console.log('Added vacantes.costo_vacante');
        } catch (e) { console.log('Notice: vacantes.costo_vacante already exists'); }

        // 2. Update candidatos_seguimiento table
        const columnsToAdd = [
            { name: 'fecha_entrevista', type: 'DATE' },
            { name: 'estado_entrevista', type: "ENUM('Pendiente', 'En Curso', 'Realizada', 'No Asistió') DEFAULT 'Pendiente'" },
            { name: 'resultado_candidato', type: "ENUM('Apto', 'No Apto', 'En Reserva')" },
            { name: 'motivo_no_apto', type: 'TEXT' },
            { name: 'estatus_90_dias', type: "ENUM('Continúa', 'Retiro Voluntario', 'Retiro por Desempeño')" }
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE candidatos_seguimiento ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added candidatos_seguimiento.${col.name}`);
            } catch (e) {
                console.log(`Notice: candidatos_seguimiento.${col.name} already exists`);
            }
        }

        console.log('Database patch completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error patching database:', error);
    }
}

patchDatabase();
