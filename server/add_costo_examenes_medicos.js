const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function addColumn() {
    try {
        console.log('--- ADDING COLUMN TO VACANTES ---');
        
        // Add column if it doesn't exist
        await pool.query('ALTER TABLE vacantes ADD COLUMN costo_examenes_medicos DECIMAL(15, 2) DEFAULT 0');
        console.log('✅ Column costo_examenes_medicos added to vacantes table successfully.');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column already exists. Skipping...');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        process.exit();
    }
}

addColumn();
