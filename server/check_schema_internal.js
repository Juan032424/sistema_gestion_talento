const pool = require('./db');

async function checkSchema() {
  try {
    console.log('--- TABLES ---');
    const [tables] = await pool.query('SHOW TABLES');
    console.log(tables);

    const tablesToCheck = ['vacantes', 'users', 'candidatos_seguimiento'];
    for (const table of tablesToCheck) {
      console.log(`\n--- ${table.toUpperCase()} SCHEMA ---`);
      const [cols] = await pool.query(`DESCRIBE ${table}`);
      console.table(cols);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
