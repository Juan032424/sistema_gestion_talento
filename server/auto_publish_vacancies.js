const pool = require('./db');

/**
 * Script para auto-publicar vacantes abiertas en el portal público
 * Este script encuentra todas las vacantes con estado 'Abierta' y las publica automáticamente
 */
async function autoPublishOpenVacancies() {
    console.log('🚀 Iniciando auto-publicación de vacantes abiertas...\n');

    try {
        // 1. Obtener todas las vacantes con estado 'Abierta'
        const [openVacancies] = await pool.query(`
            SELECT id, puesto_nombre, codigo_requisicion, fecha_apertura, estado
            FROM vacantes 
            WHERE estado = 'Abierta'
            ORDER BY fecha_apertura DESC
        `);

        console.log(`📋 Encontradas ${openVacancies.length} vacantes abiertas\n`);

        let published = 0;
        let alreadyPublic = 0;
        let errors = 0;

        for (const vacancy of openVacancies) {
            try {
                // 2. Verificar si ya existe en public_job_postings
                const [existing] = await pool.query(
                    'SELECT id, is_public FROM public_job_postings WHERE vacante_id = ?',
                    [vacancy.id]
                );

                if (existing.length > 0) {
                    // Ya existe - verificar si está público
                    if (existing[0].is_public) {
                        console.log(`✅ Ya pública: ${vacancy.codigo_requisicion} - ${vacancy.puesto_nombre}`);
                        alreadyPublic++;
                    } else {
                        // Activar como pública
                        await pool.query(
                            'UPDATE public_job_postings SET is_public = TRUE WHERE vacante_id = ?',
                            [vacancy.id]
                        );
                        console.log(`🔄 Activada: ${vacancy.codigo_requisicion} - ${vacancy.puesto_nombre}`);
                        published++;
                    }
                } else {
                    // 3. Crear nuevo registro en public_job_postings
                    // Generar slug único
                    const baseSlug = vacancy.puesto_nombre
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');

                    // Agregar ID para garantizar unicidad
                    const slug = `${baseSlug}-${vacancy.id}`;

                    await pool.query(`
                        INSERT INTO public_job_postings 
                        (vacante_id, slug, is_public, views_count, applications_count, is_featured)
                        VALUES (?, ?, TRUE, 0, 0, FALSE)
                    `, [vacancy.id, slug]);

                    console.log(`✨ Nueva publicación: ${vacancy.codigo_requisicion} - ${vacancy.puesto_nombre}`);
                    console.log(`   📎 Slug: ${slug}`);
                    published++;
                }

            } catch (error) {
                console.error(`❌ Error con vacante ${vacancy.codigo_requisicion}: ${error.message}`);
                errors++;
            }
        }

        // 4. Resumen
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE PUBLICACIÓN:');
        console.log('='.repeat(60));
        console.log(`✅ Ya públicas: ${alreadyPublic}`);
        console.log(`✨ Nuevas publicaciones: ${published}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📈 Total procesadas: ${openVacancies.length}`);
        console.log('='.repeat(60) + '\n');

        // 5. Mostrar vacantes ahora visibles en el portal
        const [publicJobs] = await pool.query(`
            SELECT 
                v.codigo_requisicion,
                v.puesto_nombre,
                v.fecha_apertura,
                pj.slug,
                pj.views_count,
                pj.applications_count
            FROM vacantes v
            INNER JOIN public_job_postings pj ON v.id = pj.vacante_id
            WHERE v.estado = 'Abierta' AND pj.is_public = TRUE
            ORDER BY v.fecha_apertura DESC
        `);

        console.log('🌐 VACANTES AHORA VISIBLES EN EL PORTAL PÚBLICO:');
        console.log('-'.repeat(60));
        publicJobs.forEach((job, index) => {
            console.log(`${index + 1}. ${job.codigo_requisicion} - ${job.puesto_nombre}`);
            console.log(`   📅 Apertura: ${new Date(job.fecha_apertura).toLocaleDateString()}`);
            console.log(`   👁️  Vistas: ${job.views_count} | 📝 Aplicaciones: ${job.applications_count}`);
            console.log(`   🔗 URL: /portal?job=${job.slug}\n`);
        });

        if (publicJobs.length === 0) {
            console.log('   (No hay vacantes públicas actualmente)\n');
        }

        console.log('✅ Proceso completado exitosamente!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

// Ejecutar
autoPublishOpenVacancies();
