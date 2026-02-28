const pool = require('./db');
async function test() {
    try {
        const id = 1; // Assuming ID 1 exists
        const updates = { estado: 'En Proceso', costo_vacante: 5000000 };
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        await pool.query(`UPDATE vacantes SET ${fields} WHERE id = ?`, values);
        console.log('Update success');
        process.exit(0);
    } catch (e) {
        console.error('Update failed:', e);
        process.exit(1);
    }
}
test();
