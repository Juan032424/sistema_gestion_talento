const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// ================================================================
// GET /api/users — List all admin users
// Accessible by Superadmin and Admin
// ================================================================
router.get('/', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, u.full_name, u.status, u.created_at, r.name as role_name, t.name as tenant_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN tenants t ON u.tenant_id = t.id
            WHERE r.name NOT IN ('Candidato')
            ORDER BY u.created_at DESC
        `;
        const [users] = await pool.query(query);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

// ================================================================
// POST /api/users — Create new admin user
// Superadmin can create any role, Admin can create Lider/Reclutador
// ================================================================
router.post('/', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    const { email, password, fullName, roleId, tenantId } = req.body;

    try {
        // Validation
        if (!email || !password || !fullName || !roleId) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios: nombre, email, contraseña y rol' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });
        }

        // Admin can only create Lider/Reclutador roles (not Superadmin or Admin)
        if (req.user.role === 'Admin') {
            const [roleCheck] = await pool.query('SELECT name FROM roles WHERE id = ?', [roleId]);
            if (roleCheck.length > 0 && ['Superadmin', 'Admin'].includes(roleCheck[0].name)) {
                return res.status(403).json({ error: 'No tienes permisos para crear usuarios con este rol' });
            }
        }

        // Check if user exists (by email)
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        const finalTenantId = tenantId || req.user.tenantId;

        // Insert user (password stored as plain text — upgrade to bcrypt in production)
        const [result] = await pool.query(`
            INSERT INTO users (tenant_id, email, password_hash, full_name, role_id, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        `, [finalTenantId, email.toLowerCase().trim(), password, fullName.trim(), roleId]);

        console.log(`✅ New user created: ${email} (ID: ${result.insertId}) by ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// ================================================================
// PUT /api/users/:id/status — Toggle user status (activate/deactivate)
// ================================================================
router.put('/:id/status', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido. Usa: active o inactive' });
    }

    try {
        // Prevent self-deactivation
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        }

        await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: `Usuario ${status === 'active' ? 'activado' : 'desactivado'} exitosamente` });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});

// ================================================================
// PUT /api/users/:id/password — Change user password
// ================================================================
router.put('/:id/password', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 6 caracteres' });
    }

    try {
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword, id]);
        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
});

// ================================================================
// GET /api/users/roles — Get available roles (excluding Candidato)
// ================================================================
router.get('/roles', verifyToken, async (req, res) => {
    try {
        let query;
        // Admin can only assign Lider and Reclutador roles
        if (req.user.role === 'Admin') {
            query = `SELECT id, name, description FROM roles WHERE name IN ('Lider', 'Reclutador') ORDER BY id`;
        } else {
            // Superadmin can assign any role except Candidato
            query = `SELECT id, name, description FROM roles WHERE name NOT IN ('Candidato') ORDER BY id`;
        }
        const [roles] = await pool.query(query);
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Error al obtener los roles' });
    }
});

// ================================================================
// GET /api/users/recruiters — Get active Reclutador users
// ================================================================
router.get('/recruiters', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name as nombre, u.email 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name IN ('Reclutador', 'Lider') AND u.status = 'active'
            ORDER BY u.full_name ASC
        `;
        const [recruiters] = await pool.query(query);
        res.json(recruiters);
    } catch (error) {
        console.error('Error fetching recruiters:', error.message);
        res.status(500).json({ error: error.message || 'Error al obtener reclutadores' });
    }
});

// ================================================================
// DELETE /api/users/:id — Delete user
// ================================================================
router.delete('/:id', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    const { id } = req.params;

    try {
        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o ya eliminado' });
        }

        console.log(`🗑️ User deleted (ID: ${id}) by ${req.user.email}`);
        res.json({ success: true, message: 'Usuario eliminado exitosamente' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario debido a dependencias en el sistema.' });
    }
});

module.exports = router;
