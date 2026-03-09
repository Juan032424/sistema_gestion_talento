require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    const pool = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const emailLower = 'test58@test.com';
        const telefono = '12345';
        const nombreCompleto = 'Test 58';
        const ciudad_residencia = 'CTG';
        const cargo_actual = 'Dev';
        const anos_experiencia = 5;
        const vacanteId = 4;

        await pool.query(`
            INSERT INTO candidatos (
                nombre, email, telefono, 
                ciudad, titulo_profesional,
                experiencia_total_anos,
                estado, etapa
            ) VALUES (?, ?, ?, ?, ?, ?, 'Activo', 'Aplicación')
            ON DUPLICATE KEY UPDATE telefono = VALUES(telefono), updated_at = NOW()
        `, [
            nombreCompleto, emailLower, telefono?.trim(),
            ciudad_residencia?.trim() || 'Cartagena', cargo_actual?.trim(),
            parseInt(anos_experiencia) || 0
        ]);
        console.log("Candidatos insert ok");

        await pool.query(`
            INSERT INTO candidatos_seguimiento (
                vacante_id, nombre_candidato, etapa_actual, fuente_reclutamiento, 
                fecha_postulacion, score_tecnico_ia, resumen_ia_entrevista
            ) VALUES (?, ?, 'Postulación', 'Portal', NOW(), ?, ?)
        `, [
            vacanteId, nombreCompleto, 80, JSON.stringify("ok")
        ]);
        console.log("Candidatos seguimiento ok");

        await pool.query(`
            INSERT INTO sourced_candidates (
                nombre, email, telefono, fuente, cv_text, ai_match_score, ai_analysis, estado
            ) VALUES (?, ?, ?, 'manual', ?, ?, ?, 'new')
            ON DUPLICATE KEY UPDATE ai_match_score = VALUES(ai_match_score), ai_analysis = VALUES(ai_analysis)
        `, [
            nombreCompleto, emailLower, telefono?.trim(),
            "foo",
            80, "{}"
        ]);
        console.log("sourced ok");
    } catch (e) {
        console.log("Error:", e.message);
    }
    pool.end();
}
test();
