const pool = require('./db');

async function checkUsers() {
    try {
        const [users] = await pool.query(`
            SELECT u.email, u.full_name, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
        `);
        console.log('--- SYSTEM USERS ---');
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
