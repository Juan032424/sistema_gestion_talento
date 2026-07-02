const pool = require('../db');

async function createAuditLogsTable() {
    try {
        console.log('Creando tabla system_audit_logs...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                user_email VARCHAR(150),
                entity_name VARCHAR(100) NOT NULL,
                entity_id VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                changes JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        
        console.log('✅ Tabla system_audit_logs creada exitosamente.');
    } catch (error) {
        console.error('❌ Error creando tabla system_audit_logs:', error);
    } finally {
        process.exit(0);
    }
}

createAuditLogsTable();
