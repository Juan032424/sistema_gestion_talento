const pool = require('./db');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is installed or we use simple hash for demo

// Simple hash function for demo if bcrypt not avail, but let's try to use valid logic 
// We will store plain text '123456' mostly for demo or simple hash if no lib
// For this script, I'll update users table to plain text for simplicity or install bcryptjs
// Let's assume we want to be secure-ish.

async function seedUsers() {
    console.log('🌱 Seeding Users with Roles...');

    const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
    const PASSWORD = 'password123'; // Default password for everyone

    try {
        // 1. Get Roles
        const [roles] = await pool.query('SELECT * FROM roles WHERE tenant_id = ? OR tenant_id IS NULL', [DEFAULT_TENANT_ID]);

        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        console.log('Roles found:', roleMap);

        const usersToCreate = [
            {
                email: 'superadmin@gh-score.com',
                name: 'Super Admin',
                role: 'Superadmin',
                tenant: DEFAULT_TENANT_ID // Technically Superadmin might have NULL tenant but for login logic we attach to default
            },
            {
                email: 'admin@discol.com',
                name: 'Gerente General',
                role: 'Admin',
                tenant: DEFAULT_TENANT_ID
            },
            {
                email: 'lider@discol.com',
                name: 'Jefe de Area',
                role: 'Lider',
                tenant: DEFAULT_TENANT_ID
            },
            {
                email: 'reclutador@discol.com',
                name: 'Analista Selección',
                role: 'Reclutador',
                tenant: DEFAULT_TENANT_ID
            }
        ];

        for (const user of usersToCreate) {
            // Check if exists
            const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);

            if (exists.length === 0) {
                // Create
                const roleId = roleMap[user.role];
                if (!roleId) {
                    console.log(`⚠️ Role ${user.role} not found, skipping ${user.email}`);
                    continue;
                }

                await pool.query(`
                    INSERT INTO users (tenant_id, email, password_hash, full_name, role_id, status)
                    VALUES (?, ?, ?, ?, ?, 'active')
                `, [user.tenant, user.email, PASSWORD, user.name, roleId]);

                console.log(`✅ Created User: ${user.name} (${user.role})`);
            } else {
                console.log(`ℹ️ User ${user.email} already exists`);
            }
        }

        console.log('\n✨ Users Seeded Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
