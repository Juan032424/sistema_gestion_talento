const pool = require('./db');
async function fixPasswords() {
    try {
        // Fix admin@discol.com password
        await pool.query(
            "UPDATE users SET password_hash = 'password123' WHERE email = 'admin@discol.com' AND password_hash = 'HASH_PENDING'"
        );
        console.log('✅ Password for admin@discol.com fixed to: password123');

        // Verify all admin users are properly set
        const [users] = await pool.query(`
            SELECT u.email, u.password_hash, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name != 'Candidato'
        `);

        console.log('\n=== Verification ===');
        users.forEach(u => console.log(`${u.email} | ${u.role} | pass: ${u.password_hash}`));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
fixPasswords();
