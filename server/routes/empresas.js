const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all empresas
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM empresas');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Create Empresa
router.post('/', async (req, res) => {
    const { nombre, nit, sector, caracteristicas } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO empresas (nombre, nit, sector, caracteristicas) VALUES (?, ?, ?, ?)',
            [nombre, nit, sector, JSON.stringify(caracteristicas || {})]
        );
        res.json({ id: result.insertId, message: 'Empresa creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT Update Empresa
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, nit, sector, caracteristicas } = req.body;
    try {
        await pool.query(
            'UPDATE empresas SET nombre = ?, nit = ?, sector = ?, caracteristicas = ? WHERE id = ?',
            [nombre, nit, sector, JSON.stringify(caracteristicas || {}), id]
        );
        res.json({ message: 'Empresa actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Empresa
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM empresas WHERE id = ?', [id]);
        res.json({ message: 'Empresa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
