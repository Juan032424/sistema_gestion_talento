
-- Fix applications table schema
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_account_id INT NULL;
ALTER TABLE applications MODIFY COLUMN cv_url TEXT;
ALTER TABLE applications MODIFY COLUMN carta_presentacion LONGTEXT;
ALTER TABLE applications MODIFY COLUMN notas_reclutador LONGTEXT;

-- Ensure candidate_notifications has correct columns from ApplicationTrackingService usage
-- If it was created without candidate_account_id
ALTER TABLE candidate_notifications ADD COLUMN IF NOT EXISTS candidate_account_id INT NULL;
ALTER TABLE candidate_notifications ADD COLUMN IF NOT EXISTS link_accion VARCHAR(500);
ALTER TABLE candidate_notifications ADD COLUMN IF NOT EXISTS metadata JSON;

-- Ensure external_candidates exists for fallbacks
CREATE TABLE IF NOT EXISTS external_candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
