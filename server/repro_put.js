const pool = require('./db');

async function testPut() {
    const id = 2;
    // Exactly what the user shows in the UI
    const payload = {
        etapa_actual: 'Prueba Técnica',
        fuente_reclutamiento: 'Referido',
        cv_url: 'https://co.computrabajo.com/empleos-en-cartagena-de-indias',
        estado_entrevista: 'En Curso',
        fecha_entrevista: '1926-01-29',
        resultado_candidato: 'Apto',
        motivo_no_apto: 'Falta experiencia',
        estatus_90_dias: 'Continúa'
    };

    try {
        console.log('NASA Test: Running PUT simulation...');

        // 1. History check
        const [rows] = await pool.query('SELECT etapa_actual, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);
        const currentRecord = rows[0];
        console.log('Current Record:', currentRecord);

        if (currentRecord && currentRecord.etapa_actual !== payload.etapa_actual) {
            console.log('Triggering history update');
            await pool.query('UPDATE historial_etapas SET fecha_fin = CURRENT_TIMESTAMP WHERE candidato_id = ? AND fecha_fin IS NULL', [id]);
            await pool.query('INSERT INTO historial_etapas (vacante_id, candidato_id, etapa_nombre) VALUES (?, ?, ?)', [currentRecord.vacante_id, id, payload.etapa_actual]);
        }

        // 2. Main Update
        const fields = Object.keys(payload);
        const sql = `UPDATE candidatos_seguimiento SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        const values = [...Object.values(payload), id];

        console.log('Executing SQL:', sql);
        console.log('Values:', values);

        const [result] = await pool.query(sql, values);
        console.log('Update Result:', result);

        process.exit(0);
    } catch (e) {
        console.error('NASA Test Failed:', e);
        process.exit(1);
    }
}

testPut();
