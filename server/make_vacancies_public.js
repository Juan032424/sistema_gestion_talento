const pool = require('./db');

async function makeVacanciesPublic() {
    console.log('Making ALL open vacancies public...\n');

    try {
        // Hacer públicas todas las vacantes abiertas
        const [result] = await pool.query(`
            UPDATE public_job_postings pj
            INNER JOIN vacantes v ON pj.vacante_id = v.id
            SET pj.is_public = TRUE, pj.is_featured = TRUE
            WHERE v.estado = 'Abierta'
        `);

        console.log(`✅ Updated ${result.affectedRows} vacancies to public`);

        // Mostrar las vacantes públicas
        const [publicJobs] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.estado,
                pj.slug,
                pj.is_public,
                pj.is_featured
            FROM vacantes v
            INNER JOIN public_job_postings pj ON v.id = pj.vacante_id
            WHERE pj.is_public = TRUE
        `);

        console.log(`\n📋 Public Vacancies (${publicJobs.length}):`);
        publicJobs.forEach(j => {
            console.log(`  ${j.is_featured ? '⭐' : '📌'} ${j.puesto_nombre}`);
            console.log(`     Slug: ${j.slug}`);
            console.log(`     URL: http://localhost:5173/portal/jobs/${j.slug}\n`);
        });

        console.log('\n✅ Portal ready at: http://localhost:5173/portal');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

makeVacanciesPublic();
