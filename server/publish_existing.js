const pool = require('./db');

/**
 * PUBLISH EXISTING OPEN VACANCIES
 * This script publishes all existing vacancies with estado='Abierta'
 */
async function publishExistingVacancies() {
    console.log('🌐 Publishing existing open vacancies to public portal...\n');

    try {
        // Get all open vacancies
        const [openVacancies] = await pool.query(`
            SELECT id, codigo_requisicion, puesto_nombre, fecha_apertura 
            FROM vacantes 
            WHERE estado = 'Abierta'
            ORDER BY fecha_apertura DESC
        `);

        console.log(`Found ${openVacancies.length} open vacancies\n`);

        for (const vacancy of openVacancies) {
            try {
                // Check if already published
                const [existing] = await pool.query(
                    'SELECT id FROM public_job_postings WHERE vacante_id = ?',
                    [vacancy.id]
                );

                if (existing.length === 0) {
                    // Create slug
                    const baseSlug = vacancy.puesto_nombre
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');

                    const slug = `${baseSlug}-${vacancy.id}`;

                    // Insert
                    await pool.query(`
                        INSERT INTO public_job_postings 
                        (vacante_id, slug, is_public, views_count, applications_count, is_featured)
                        VALUES (?, ?, TRUE, 0, 0, FALSE)
                    `, [vacancy.id, slug]);

                    console.log(`✅ Published: ${vacancy.codigo_requisicion} - ${vacancy.puesto_nombre}`);
                } else {
                    console.log(`⏭️  Already exists: ${vacancy.codigo_requisicion}`);
                }

            } catch (error) {
                console.error(`❌ Error with ${vacancy.codigo_requisicion}:`, error.message);
            }
        }

        console.log('\n✅ Done!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

publishExistingVacancies();
