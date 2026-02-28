const pool = require('./db');
const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function setupCandidatePortal() {
    console.log('🚀 Setting up Candidate Portal Schema...');

    try {
        // 1. Create Profile Table linked to Users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidate_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                tenant_id CHAR(36) NOT NULL,
                headline VARCHAR(255), -- "Full Stack Developer"
                phone VARCHAR(50),
                location VARCHAR(100),
                linkedin_url VARCHAR(255),
                portfolio_url VARCHAR(255),
                resume_url VARCHAR(500), -- Path to uploaded file
                skills_json JSON, -- ["React", "Node"]
                experience_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Created candidate_profiles table');

        // 2. Ensure 'Candidato' Role exists
        const [roles] = await pool.query(`SELECT id FROM roles WHERE name = 'Candidato' AND tenant_id = ?`, [DEFAULT_TENANT_ID]);

        let candidateRoleId;
        if (roles.length === 0) {
            const [res] = await pool.query(`
                INSERT INTO roles (tenant_id, name, description, is_system_role) 
                VALUES (?, 'Candidato', 'Usuario externo para postulaciones', TRUE)
            `, [DEFAULT_TENANT_ID]);
            candidateRoleId = res.insertId;
            console.log('✅ Created "Candidato" Role');
        } else {
            candidateRoleId = roles[0].id;
            console.log('ℹ️ "Candidato" Role already exists');
        }

        // 3. Assign Permissions to Candidato (Only Portal stuff)
        // Ensure permissions exist first
        await pool.query(`
            INSERT IGNORE INTO permissions (slug, description, category) VALUES
            ('portal.view', 'Access Candidate Portal', 'Portal'),
            ('profile.manage', 'Manage own profile', 'Portal')
        `);

        // Link permissions
        const perms = ['portal.view', 'profile.manage'];
        for (const slug of perms) {
            const [p] = await pool.query('SELECT id FROM permissions WHERE slug = ?', [slug]);
            if (p.length > 0) {
                await pool.query(`
                    INSERT IGNORE INTO role_permissions (role_id, permission_id) 
                    VALUES (?, ?)
                `, [candidateRoleId, p[0].id]);
            }
        }
        console.log('✅ Assigned restricted permissions to Candidato');

        console.log('\n✨ Candidate Portal Schema Ready!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setupCandidatePortal();
