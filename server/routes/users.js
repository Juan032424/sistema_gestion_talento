const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const auditService = require('../services/AuditService');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración multer para avatares
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads/avatars');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});
const uploadAvatar = multer({ 
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP)'));
    }
});

// ================================================================
// GET /api/users — List all admin users
// Accessible by Superadmin and Admin
// ================================================================
router.get('/', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, u.full_name, u.status, u.created_at, u.avatar_url, u.cedula, r.name as role_name, t.name as tenant_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN tenants t ON u.tenant_id = t.id
            WHERE r.name NOT IN ('Candidato') AND u.deleted_at IS NULL
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
    const { email, password, fullName, roleId, tenantId, cedula } = req.body;

    try {
        // Validation
        if (!email || !password || !fullName || !roleId || !cedula) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios: nombre, cédula, email, contraseña y rol' });
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
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user (password stored as bcrypt hash in production)
        const [result] = await pool.query(`
            INSERT INTO users (tenant_id, email, password_hash, full_name, role_id, status, cedula)
            VALUES (?, ?, ?, ?, ?, 'active', ?)
        `, [finalTenantId, email.toLowerCase().trim(), hashedPassword, fullName.trim(), roleId, cedula.trim()]);

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
// POST /api/users/:id/avatar — Upload and save avatar
// ================================================================
router.post('/:id/avatar', verifyToken, requireRole(['Superadmin', 'Admin']), uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se procesó la imagen correctamente. Verifica el formato.' });
        }
        
        // Make the URL relative from the public directory
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.params.id]);
        
        res.json({ success: true, avatarUrl, message: 'Foto de perfil actualizada exitosamente' });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Error de servidor al subir la imagen' });
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
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
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
            SELECT u.id, u.full_name as nombre, u.email, u.avatar_url 
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

        // Soft delete
        const [result] = await pool.query('UPDATE users SET deleted_at = NOW(), status = "inactive" WHERE id = ? AND deleted_at IS NULL', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o ya eliminado' });
        }

        await auditService.log(
            req.user?.id || null,
            req.user?.email || null,
            'users',
            id,
            'DELETE (Soft)',
            { note: 'Usuario movido a la papelera (Soft delete)' },
            req.ip
        );

        console.log(`🗑️ User soft-deleted (ID: ${id}) by ${req.user.email}`);
        res.json({ success: true, message: 'Usuario eliminado (archivado) exitosamente' });

    } catch (error) {
        console.error('Error soft deleting user:', error);
        res.status(500).json({ error: 'Error de sistema al eliminar el usuario' });
    }
});

// ================================================================
// GET /api/users/audit/logs — Get system audit trails (Superadmin)
// ================================================================
router.get('/audit/logs', verifyToken, requireRole(['Superadmin']), async (req, res) => {
    try {
        const logs = await auditService.getLogs(200);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Error al obtener los logs de auditoría' });
    }
});

module.exports = router;
