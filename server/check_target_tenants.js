const pool = require('./db');

async function checkTenants() {
    try {
        const [users] = await pool.query(`
            SELECT u.email, u.tenant_id, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.email IN ('gestionhumana@discolsas.com', 'm.acosta@discolsas.com', 'analistaghumana@discolsas.com')
        `);
        console.log('--- TARGET USERS TENANTS ---');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error checking tenants:', error);
        process.exit(1);
    }
}

checkTenants();
