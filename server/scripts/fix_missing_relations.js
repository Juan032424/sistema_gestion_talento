const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'sistema_gestion_talento'
    });

    try {
        console.log("Fetching applications to sync relationships...");
        const [applications] = await conn.query(`
            SELECT a.id as application_id, a.vacante_id, a.candidato_id, a.estado as estado_app, a.salario_esperado, a.cv_url,
                   c.primer_nombre, c.primer_apellido
            FROM applications a
            LEFT JOIN candidatos c ON a.candidato_id = c.id
        `);

        console.log(`Found ${applications.length} applications. Syhcing to candidato_vacante and candidatos_seguimiento...`);
        let synced_candidato_vacante = 0;
        let synced_candidatos_seguimiento = 0;

        for (const app of applications) {
            const nombre_completo = (
                (app.primer_nombre || '') + ' ' + 
                (app.primer_apellido || '')
            ).trim();

            const estado_etapa = app.estado_app || 'Postulación';

            // 1. candidato_vacante
            if (app.candidato_id && app.vacante_id) {
                try {
                    await conn.query(`
                        INSERT INTO candidato_vacante (candidato_id, vacante_id, estado_etapa, fecha_asignacion)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE estado_etapa = ?, fecha_actualizacion = NOW()
                    `, [app.candidato_id, app.vacante_id, estado_etapa, estado_etapa]);
                    synced_candidato_vacante++;
                } catch(e) {
                    console.log("Error inserting candidato_vacante:", e.message);
                }
            }

            // 2. candidatos_seguimiento (if you use this table)
            if (app.vacante_id && nombre_completo) {
                try {
                    await conn.query(`
                        INSERT INTO candidatos_seguimiento 
                        (vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento, 
                         salario_pretendido, cv_url, fecha_postulacion, estado_entrevista)
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Pendiente')
                    `, [
                        app.vacante_id, 
                        nombre_completo,
                        estado_etapa,
                        'CSV Migration',
                        app.salario_esperado || 0,
                        app.cv_url || ''
                    ]);
                    synced_candidatos_seguimiento++;
                } catch(e) {
                    // Ignore duplicates or missing tables
                }
            }
        }

        console.log(`Synced ${synced_candidato_vacante} to candidato_vacante`);
        console.log(`Synced ${synced_candidatos_seguimiento} to candidatos_seguimiento`);

    } catch(err) {
        console.error("Migration error:", err);
    }

    await conn.end();
}

main().catch(console.error);
