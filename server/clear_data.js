const pool = require('./db');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function clearData() {
    console.log("⚠️  ADVERTENCIA: Esto borrará todos los datos transaccionales del sistema.");
    console.log("Se mantendrán: Usuarios, Roles, Sedes, Empresas, Centros de Costo, Permisos.");
    console.log("Se borrarán: Vacantes, Candidatos, Notificaciones, Evaluaciones, Logs, Campañas, etc.\n");

    const answer = await new Promise(resolve => {
        rl.question("¿Estás seguro de que quieres continuar? (escribe 'SI' para confirmar): ", resolve);
    });

    if (answer.trim() !== 'SI') {
        console.log("Operación cancelada.");
        process.exit(0);
    }

    try {
        console.log("\nIniciando borrado de datos...");

        // Desactivar temporalmente restricción de llaves foráneas para poder borrar en cascada sin errores
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToClear = [
            'historial_etapas',
            'candidato_vacante',
            'candidate_skills',
            'candidate_languages',
            'candidate_experience',
            'candidate_education',
            'candidate_documents',
            'candidate_saved_jobs',
            'candidatos_seguimiento',
            'candidate_activity_logs',
            'candidate_activity_log',
            'applications',
            'application_tracking_links',
            'external_candidates',
            'candidate_notifications',
            'candidatos',
            'sourced_candidates',
            'campaign_executions',
            'sourcing_campaigns',
            'auto_matches',
            'public_job_postings',
            'job_board_sources',
            'evaluacion_servicio_gh',
            'agent_logs',
            'notifications',
            'referidos',
            'vacantes',
            'candidate_accounts',
            'candidate_profiles'
        ];

        for (const table of tablesToClear) {
            try {
                await pool.query(`TRUNCATE TABLE ${table}`);
                console.log(`✅ Tabla limpiada: ${table}`);
            } catch (err) {
                // If table doesn't exist, ignore
                if (err.code !== 'ER_NO_SUCH_TABLE') {
                    console.error(`❌ Error al limpiar ${table}:`, err.message);
                } else {
                    console.log(`⚠️  Tabla omitida (no existe): ${table}`);
                }
            }
        }

        // Reactivar llaves foráneas
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("\n🎉 ¡Limpieza de datos completada exitosamente!");
        console.log("El sistema está listo para recibir nuevos datos limpios desde cero.");

    } catch (error) {
        console.error("Error crítico durante la limpieza:", error);
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    process.exit(0);
}

clearData();
