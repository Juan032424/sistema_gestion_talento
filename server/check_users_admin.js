const pool = require('./db');
async function check() {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.email, u.full_name, u.password_hash, u.status, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name != 'Candidato'
            ORDER BY u.id
        `);
        console.log('=== USUARIOS ADMIN ===');
        users.forEach(u => {
            console.log(`[${u.id}] ${u.email} | Rol: ${u.role} | Estado: ${u.status} | Pass: ${u.password_hash}`);
        });

        const [roles] = await pool.query('SELECT id, name FROM roles ORDER BY id');
        console.log('\n=== ROLES ===');
        roles.forEach(r => console.log(`[${r.id}] ${r.name}`));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
check();
