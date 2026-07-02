const pool = require('../db');

async function addSoftDeletes() {
    try {
        console.log('Añadiendo soporte para Eliminación Lógica (Soft Deletes)...');
        
        // 1. Vacantes
        try {
            await pool.query(`ALTER TABLE vacantes ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
            console.log('✅ Columna deleted_at añadida a vacantes.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ La columna deleted_at ya existe en vacantes.');
            else throw e;
        }

        // 2. Candidatos Seguimiento
        try {
            await pool.query(`ALTER TABLE candidatos_seguimiento ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
            console.log('✅ Columna deleted_at añadida a candidatos_seguimiento.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ La columna deleted_at ya existe en candidatos_seguimiento.');
            else throw e;
        }

        // 3. Users (admin panel)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
            console.log('✅ Columna deleted_at añadida a users.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ La columna deleted_at ya existe en users.');
            else throw e;
        }

        console.log('🎉 Migración de Soft Deletes completada.');
    } catch (error) {
        console.error('❌ Error añadiendo soft deletes:', error);
    } finally {
        process.exit(0);
    }
}

addSoftDeletes();
