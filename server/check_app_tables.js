const pool = require('./db');

async function checkTables() {
    try {
        console.log('Checking application system tables...\n');

        const tables = [
            'applications',
            'external_candidates',
            'public_job_postings',
            'notifications',
            'auto_matches'
        ];

        for (const table of tables) {
            try {
                const [rows] = await pool.query(`SHOW TABLES LIKE '${table}'`);
                if (rows.length > 0) {
                    const [count] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`✅ ${table} exists (${count[0].count} rows)`);
                } else {
                    console.log(`❌ ${table} does NOT exist`);
                }
            } catch (err) {
                console.log(`❌ ${table} error:`, err.message);
            }
        }

        console.log('\n--- Testing public jobs query ---');
        const [jobs] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.estado,
                pj.slug,
                pj.is_public
            FROM vacantes v
            LEFT JOIN public_job_postings pj ON v.id = pj.vacante_id
            LIMIT 5
        `);

        console.log(`Found ${jobs.length} vacancies`);
        jobs.forEach(j => {
            console.log(`  - ID ${j.id}: ${j.puesto_nombre} (${j.estado}) - Public: ${j.is_public || 'NOT IN PORTAL'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkTables();
