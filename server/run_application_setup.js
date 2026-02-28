const pool = require('./db');
const fs = require('fs');

async function setupApplicationSystem() {
    console.log('Setting up Application System Database...');

    const sql = fs.readFileSync('./setup_application_system.sql', 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        try {
            if (statement.includes('SELECT')) {
                const [result] = await pool.query(statement);
                console.log('✅', result);
            } else {
                await pool.query(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            }
        } catch (error) {
            // Ignore "already exists" errors
            if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
                console.error('❌ Error:', error.message);
            }
        }
    }

    console.log('\n🎉 Application System setup complete!');
    process.exit(0);
}

setupApplicationSystem().catch(console.error);
