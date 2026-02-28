const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all sedes (with empresa info)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, e.nombre as empresa_nombre 
            FROM sedes s
            LEFT JOIN empresas e ON s.empresa_id = e.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Create Sede
router.post('/', async (req, res) => {
    const { nombre, empresa_id, direccion, contacto } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO sedes (nombre, empresa_id, direccion, contacto) VALUES (?, ?, ?, ?)',
            [nombre, empresa_id, direccion, contacto]
        );
        res.json({ id: result.insertId, message: 'Sede creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT Update Sede
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, empresa_id, direccion, contacto } = req.body;
    try {
        await pool.query(
            'UPDATE sedes SET nombre = ?, empresa_id = ?, direccion = ?, contacto = ? WHERE id = ?',
            [nombre, empresa_id, direccion, contacto, id]
        );
        res.json({ message: 'Sede actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Sede
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sedes WHERE id = ?', [id]);
        res.json({ message: 'Sede eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
