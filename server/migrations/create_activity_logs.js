const pool = require('../db');

async function createActivityLogsTable() {
    console.log('Creating Candidate Activity Logs table...');

    const query = `
        CREATE TABLE IF NOT EXISTS candidate_activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            activity_type VARCHAR(50) NOT NULL,
            description TEXT,
            related_id INT,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_candidate (candidate_id),
            INDEX idx_activity (activity_type),
            INDEX idx_created (created_at),
            FOREIGN KEY (candidate_id) REFERENCES candidatos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

    try {
        await pool.query(query);
        console.log('✅ Table candidate_activity_logs created successfully');
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
    } finally {
        process.exit(0);
    }
}

createActivityLogsTable();
