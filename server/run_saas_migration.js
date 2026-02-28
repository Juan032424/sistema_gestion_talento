const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Starting SaaS Migration...');

    try {
        // 1. Run Schema Creation
        const sql = fs.readFileSync(path.join(__dirname, 'setup_saas_schema.sql'), 'utf8');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await pool.query(statement);
            } catch (err) {
                // Ignore "already exists" errors for idempotency
                if (!err.message.includes("Duplicate entry") && !err.message.includes("already exists")) {
                    console.error('SQL Error:', err.message);
                }
            }
        }
        console.log('✅ SaaS Tables Created');

        // 2. Add tenant_id to existing tables
        const tablesToMigrate = ['vacantes', 'external_candidates', 'applications', 'proyectos', 'notifications'];
        const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';

        for (const table of tablesToMigrate) {
            try {
                // Check if column exists
                const [cols] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE 'tenant_id'`);

                if (cols.length === 0) {
                    console.log(`Migrating table: ${table}...`);

                    // Add column
                    await pool.query(`
                        ALTER TABLE ${table} 
                        ADD COLUMN tenant_id CHAR(36) NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
                        ADD INDEX idx_tenant (tenant_id),
                        ADD CONSTRAINT fk_${table}_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
                    `);

                    console.log(`✅ ${table} migrated to Multitenancy`);
                } else {
                    console.log(`ℹ️ ${table} already has tenant_id`);
                }
            } catch (err) {
                console.error(`❌ Error migrating ${table}:`, err.message);
            }
        }

        // 3. Create Default Admin User
        const [adminRole] = await pool.query(`SELECT id FROM roles WHERE name = 'Admin' AND tenant_id = ?`, [DEFAULT_TENANT_ID]);

        if (adminRole.length > 0) {
            // Check if user exists
            const [users] = await pool.query(`SELECT * FROM users WHERE email = 'admin@discol.com'`);

            if (users.length === 0) {
                await pool.query(`
                    INSERT INTO users (tenant_id, email, password_hash, full_name, role_id, status)
                    VALUES (?, 'admin@discol.com', 'HASH_PENDING', 'System Admin', ?, 'active')
                 `, [DEFAULT_TENANT_ID, adminRole[0].id]);
                console.log('✅ Default Admin User Created (admin@discol.com)');
            }
        }

        console.log('\n🎉 Migration Complete! System is now Multitenant.');
        process.exit(0);

    } catch (error) {
        console.error('Critical Migration Error:', error);
        process.exit(1);
    }
}

runMigration();
