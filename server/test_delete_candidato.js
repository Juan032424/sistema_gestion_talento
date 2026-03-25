const pool = require('./db');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function check() {
    const id = 9; // The ID user tried to delete
    try {
        // Simulate what the delete endpoint does
        await pool.query('DELETE FROM historial_etapas WHERE candidato_id = ?', [id]);
        await pool.query('DELETE FROM ai_evaluations WHERE candidate_id = ?', [id]);
        const [result] = await pool.query('DELETE FROM candidatos_seguimiento WHERE id = ?', [id]);
        console.log('Result:', result);
    } catch (error) {
        console.error('Simulated delete error:', error);
    } finally {
        process.exit();
    }
}

check();
