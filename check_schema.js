const pool = require('./server/db');

async function checkSchema() {
  try {
    console.log('--- VACANTES SCHEMA ---');
    const [vacantesCols] = await pool.query('DESCRIBE vacantes');
    console.table(vacantesCols);

    console.log('\n--- USERS SCHEMA ---');
    const [usersCols] = await pool.query('DESCRIBE users');
    console.table(usersCols);

    console.log('\n--- CANDIDATOS_SEGUIMIENTO SCHEMA ---');
    const [candidatosCols] = await pool.query('DESCRIBE candidatos_seguimiento');
    console.table(candidatosCols);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
