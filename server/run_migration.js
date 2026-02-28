const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migration_gemini.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon but ignore semicolons inside BEGIN...END blocks
        // Actually, for triggers it's easier to just run the parts manually or use a better parser.
        // I'll split into main sections.

        console.log('--- Iniciando migración ---');

        // Let's run it block by block manually to be safe with triggers

        const sessions = sql.split('-- ');
        for (let session of sessions) {
            if (!session.trim()) continue;

            // Re-add the -- for comment if needed or just use the content
            const lines = session.split('\n');
            const title = lines[0].trim();
            const commands = lines.slice(1).join('\n').trim();

            if (commands) {
                console.log(`Ejecutando: ${title}`);
                // If it's the triggers section, we need to handle the two triggers separately
                if (title.includes('4. Triggers')) {
                    const triggerParts = commands.split(';');
                    let currentTrigger = '';
                    for (let part of triggerParts) {
                        const trimmed = part.trim();
                        if (!trimmed) continue;
                        if (trimmed.startsWith('DROP TRIGGER') || trimmed.startsWith('CREATE TRIGGER') || currentTrigger) {
                            currentTrigger += trimmed + ';';
                            if (trimmed.endsWith('END')) {
                                await pool.query(currentTrigger);
                                currentTrigger = '';
                            } else if (trimmed.startsWith('DROP TRIGGER')) {
                                await pool.query(trimmed);
                                currentTrigger = '';
                            }
                        }
                    }
                } else if (title.includes('2. Agregar columnas') || title.includes('3. Agregar columnas')) {
                    const individualAlters = commands.split(';');
                    for (let alter of individualAlters) {
                        if (alter.trim()) {
                            try {
                                await pool.query(alter.trim());
                            } catch (e) {
                                console.log('Skip alter (likely exists):', alter.trim().substring(0, 50));
                            }
                        }
                    }
                } else {
                    // Regular commands
                    const individualCmds = commands.split(';');
                    for (let cmd of individualCmds) {
                        if (cmd.trim()) {
                            await pool.query(cmd.trim());
                        }
                    }
                }
            }
        }

        console.log('--- Migración completada ---');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

runMigration();
