const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// ==========================================
// 1. REQUISICIONES (VACANTES - RP)
// ==========================================

// Obtener todas las vacantes con datos ERP
router.get('/requisiciones', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, idu_rp as codigo_erp, puesto_nombre, solicitante_nombre as solicitante,
                   estado_erp, fecha_apertura 
            FROM vacantes 
            ORDER BY fecha_apertura DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo requisiciones' });
    }
});

// ==========================================
// 2. ASPIRANTES (APLICACIONES - RA)
// ==========================================

// Crear o actualizar un registro de Aspirante (Postulación de un candidato a una Vacante)
router.post('/aspirantes', verifyToken, async (req, res) => {
    const { idu_ra, idu_rp, candidato_identificacion, resultado_evaluacion, experiencia_requerida, estado_aspirante } = req.body;
    
    try {
        await pool.query(`
            INSERT INTO applications_erp 
            (idu_ra, idu_rp, candidato_identificacion, resultado_evaluacion, experiencia_requerida, estado_aspirante)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            resultado_evaluacion = VALUES(resultado_evaluacion),
            experiencia_requerida = VALUES(experiencia_requerida),
            estado_aspirante = VALUES(estado_aspirante)
        `, [idu_ra, idu_rp, candidato_identificacion, resultado_evaluacion, experiencia_requerida, estado_aspirante]);
        
        res.json({ success: true, message: 'Registro de Aspirante (RA) actualizado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error guardando aspirante' });
    }
});

// ==========================================
// 3. CONTRATACIONES (CONTRATOS - RC)
// ==========================================

// Crear o actualizar un registro de Contratación (Paso final)
router.post('/contratos', verifyToken, async (req, res) => {
    const { idu_rc, idu_ra, candidato_identificacion, estado_vinculacion } = req.body;
    // (PD: La carga de PDFs (EMO, Hoja Vida, Identificacion) se haría con Multer en otra ruta,
    // pero aquí guardamos la data principal)
    try {
        await pool.query(`
            INSERT INTO contracts_erp 
            (idu_rc, idu_ra, candidato_identificacion, estado_vinculacion)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            estado_vinculacion = VALUES(estado_vinculacion)
        `, [idu_rc, idu_ra, candidato_identificacion, estado_vinculacion]);
        
        res.json({ success: true, message: 'Registro de Contratación (RC) actualizado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error guardando contrato' });
    }
});

module.exports = router;
