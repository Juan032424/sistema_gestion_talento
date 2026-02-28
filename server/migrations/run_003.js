const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Ejecutando migración 003: Sistema de autenticación para candidatos...\n');

        const sqlFile = path.join(__dirname, '003_candidate_auth_system.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Separar por delimitadores y ejecutar cada statement
        const statements = sql
            .split(/DELIMITER \$\$|DELIMITER ;/)
            .filter(s => s.trim())
            .flatMap(s => s.split(';'))
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s !== 'DELIMITER');

        let executed = 0;
        let errors = 0;

        for (const statement of statements) {
            if (!statement) continue;

            try {
                await pool.query(statement);
                executed++;
                if (statement.toUpperCase().includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
                    console.log(`  ✅ Tabla: ${tableName}`);
                } else if (statement.toUpperCase().includes('ALTER TABLE')) {
                    const tableName = statement.match(/ALTER TABLE `?(\w+)`?/i)?.[1];
                    console.log(`  🔧 Modificada: ${tableName}`);
                }
            } catch (error) {
                // Ignorar errores de columnas/tablas que ya existen
                if (!error.message.includes('Duplicate') &&
                    !error.message.includes('already exists') &&
                    !error.message.includes('check that column')) {
                    console.error(`  ❌ Error: ${error.message.substring(0, 100)}`);
                    errors++;
                }
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   - Statements ejecutados: ${executed}`);
        console.log(`   - Errores: ${errors}`);

        // Verificar tablas creadas
        const [tables] = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name IN (
                'application_tracking_links',
                'candidate_notifications',
                'candidate_documents',
                'candidate_skills',
                'candidate_languages'
            )
        `);

        console.log(`\n✅ Tablas verificadas:`);
        tables.forEach(t => console.log(`   - ${t.table_name}`));

        // Verificar candidatos con cuenta
        const [candidates] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM external_candidates 
            WHERE has_account = TRUE
        `);

        console.log(`\n👥 Candidatos con cuenta: ${candidates[0].total}`);

        console.log('\n✅ Migración 003 completada exitosamente!\n');

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

runMigration();
