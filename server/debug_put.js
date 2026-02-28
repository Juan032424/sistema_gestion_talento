const pool = require('./db');

async function debugUpdate() {
    const id = 2;
    // Set a different stage to trigger history logic
    const updates = {
        etapa_actual: 'Entrevista RH',
        fuente_reclutamiento: 'Referido',
        estatus_90_dias: 'Continúa'
    };

    try {
        console.log('NASA Debug Script Starting...');

        // 1. Check current state (Step 1 of server logic)
        const [current] = await pool.query('SELECT etapa_actual, vacante_id FROM candidatos_seguimiento WHERE id = ?', [id]);
        if (current.length === 0) {
            console.error('Candidato 2 not found');
            process.exit(1);
        }

        // 2. Stage history logic (Step 2 of server logic)
        if (updates.etapa_actual && current[0].etapa_actual !== updates.etapa_actual) {
            console.log(`NASA Debug: Etapa change detected from "${current[0].etapa_actual}" to "${updates.etapa_actual}"`);
            await pool.query('UPDATE historial_etapas SET fecha_fin = CURRENT_TIMESTAMP WHERE candidato_id = ? AND fecha_fin IS NULL', [id]);
            await pool.query('INSERT INTO historial_etapas (vacante_id, candidato_id, etapa_nombre) VALUES (?, ?, ?)', [current[0].vacante_id, id, updates.etapa_actual]);
            console.log('NASA Debug: Stage history updated.');
        }

        const allowedFields = [
            'vacante_id', 'nombre_candidato', 'etapa_actual', 'fuente_reclutamiento',
            'salario_pretendido', 'fecha_entrevista', 'estado_entrevista',
            'resultado_candidato', 'motivo_no_apto', 'estatus_90_dias',
            'cv_url', 'fecha_postulacion', 'fecha_contratacion'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                if (updates[key] === '' || updates[key] === undefined || updates[key] === null) {
                    filteredUpdates[key] = null;
                } else {
                    filteredUpdates[key] = updates[key];
                }
            }
        });

        const fields = Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates), id];

        console.log('Executing query:', `UPDATE candidatos_seguimiento SET ${fields} WHERE id = ?`, values);
        const [result] = await pool.query(`UPDATE candidatos_seguimiento SET ${fields} WHERE id = ?`, values);
        console.log('Update success!', result);
        process.exit(0);
    } catch (error) {
        console.error('NASA Fatal Error in Debug Script:', error);
        process.exit(1);
    }
}

debugUpdate();
