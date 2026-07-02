const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const emailService = require('../services/EmailService');
const auditService = require('../services/AuditService');

const allowedRolesRead = ['Superadmin', 'Admin', 'Reclutador', 'Lider'];
const allowedRolesWrite = ['Superadmin', 'Admin', 'Lider'];

// GET next requisition code
router.get('/next-code', verifyToken, requireRole(allowedRolesRead), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT codigo_requisicion FROM vacantes WHERE codigo_requisicion LIKE 'REQ-%' ORDER BY id DESC LIMIT 1");

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastCode = rows[0].codigo_requisicion;
            const lastNumber = parseInt(lastCode.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const nextCode = `REQ-${nextNumber.toString().padStart(3, '0')}`;
        res.json({ nextCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all vacantes
router.get('/', verifyToken, requireRole(allowedRolesRead), async (req, res) => {
    try {
        let query = `
            SELECT v.*, 
                s.nombre as sede_nombre, 
                p.nombre as proceso_nombre,
                proy.nombre as proyecto_nombre,
                cc.nombre as centro_nombre,
                sc.nombre as subcentro_nombre,
                tt.nombre as tipo_trabajo_nombre,
                tp.nombre as tipo_proyecto_nombre,
                us.avatar_url as responsable_avatar
            FROM vacantes v
            LEFT JOIN users us ON v.responsable_rh = us.full_name
            LEFT JOIN sedes s ON v.sede_id = s.id
            LEFT JOIN procesos p ON v.proceso_id = p.id
            LEFT JOIN proyectos proy ON v.proyecto_id = proy.id
            LEFT JOIN centros_costo cc ON v.centro_costo_id = cc.id
            LEFT JOIN subcentros_costo sc ON v.subcentro_id = sc.id
            LEFT JOIN tipos_trabajo tt ON v.tipo_trabajo_id = tt.id
            LEFT JOIN tipos_proyecto tp ON v.tipo_proyecto_id = tp.id
            WHERE v.deleted_at IS NULL
        `;
        const params = [];
        if (req.query.periodo) {
            query += " AND v.periodo = ?";
            params.push(req.query.periodo);
        }
        query += " ORDER BY v.fecha_apertura DESC";
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET statistics (Lead Time & KPIs)
router.get('/stats', verifyToken, requireRole(allowedRolesRead), async (req, res) => {
    try {
        const { periodo, sede_id, id } = req.query;
        let whereClause = 'WHERE deleted_at IS NULL';
        const params = [];

        if (periodo && periodo !== 'HISTORICO' && periodo !== '2024-HIST') {
            whereClause += ' AND periodo = ?';
            params.push(periodo);
        } else if (periodo === '2024-HIST') {
            whereClause += " AND periodo LIKE '2024-%'";
        }
        if (sede_id) {
            whereClause += ' AND sede_id = ?';
            params.push(sede_id);
        }
        if (id) {
            whereClause += ' AND id = ?';
            params.push(id);
        }

        const [vacantes] = await pool.query(`SELECT * FROM vacantes ${whereClause}`, params);

        let totalLeadTime = 0;
        let closedCount = 0;
        let openCount = 0;
        let onTimeCount = 0;
        let expiredCount = 0;

        const now = new Date();

        vacantes.forEach(v => {
            const start = new Date(v.fecha_apertura);
            const end = v.fecha_cierre_real ? new Date(v.fecha_cierre_real) : now;

            // Calculate lead time in days
            const diffTime = Math.abs(end - start);
            const leadTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (v.estado === 'Cubierta' && v.fecha_cierre_real) {
                totalLeadTime += leadTime;
                closedCount++;

                // On time check
                if (new Date(v.fecha_cierre_real) <= new Date(v.fecha_cierre_estimada)) {
                    onTimeCount++;
                }
            } else if (v.estado === 'Abierta' || v.estado === 'En Proceso') {
                openCount++;
                if (now > new Date(v.fecha_cierre_estimada)) {
                    expiredCount++;
                }
            }
        });

        const avgLeadTime = closedCount > 0 ? (totalLeadTime / closedCount).toFixed(1) : 0;
        const efficiency = closedCount > 0 ? ((onTimeCount / closedCount) * 100).toFixed(1) : 0;

        // Financial Impact Calculation & State Breakdown
        let totalFinancialImpact = 0;
        let totalInvestment = 0; // Solid costs (spent)
        let totalLoss = 0;       // Opportunity/Delay loss

        const impactByState = {
            'Abierta': 0,
            'En Proceso': 0,
            'Cubierta': 0,
            'Cancelada': 0,
            'Suspendida': 0
        };

        vacantes.forEach(v => {
            let stateImpact = 0;
            
            // 1. Direct Vacancy Cost (spent regardless of status if filled in)
            const directCost = Number(v.costo_vacante || 0);
            stateImpact += directCost;
            totalInvestment += directCost;

            // 2. Extra costs for filled positions
            if (v.estado === 'Cubierta') {
                const extraCosts = Number(v.costo_examenes_medicos || 0) + Number(v.costo_final_contratacion || 0);
                stateImpact += extraCosts;
                totalInvestment += extraCosts;
            }

            // 3. Opportunity Cost / Delay Loss (for open/in process)
            if (v.estado !== 'Cubierta' && v.estado !== 'Cancelada' && now > new Date(v.fecha_cierre_estimada)) {
                const start = new Date(v.fecha_cierre_estimada);
                const diffTime = Math.abs(now - start);
                const daysDelayed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const dailySalary = (v.salario_base || 0) / 30;
                
                // Formula: Productivity Loss = Daily Salary * Days Delayed * 1.5 factor
                const delayLoss = dailySalary * daysDelayed * 1.5;
                stateImpact += delayLoss;
                totalLoss += delayLoss;
            }

            impactByState[v.estado] = (impactByState[v.estado] || 0) + stateImpact;
        });

        totalFinancialImpact = totalInvestment + totalLoss;

        // Recruiter workload balance
        const [recruiterWorkload] = await pool.query(`
            SELECT responsable_rh, COUNT(*) as active_count 
            FROM vacantes 
            ${whereClause} AND estado IN ('Abierta', 'En Proceso')
            GROUP BY responsable_rh
        `, params);

        // Geographic distribution
        const [geoDistribution] = await pool.query(`
            SELECT s.nombre as sede, COUNT(*) as count 
            FROM vacantes v
            JOIN sedes s ON v.sede_id = s.id
            ${whereClause.replace('periodo', 'v.periodo').replace('sede_id', 'v.sede_id').replace(' id ', ' v.id ')} AND v.estado IN ('Abierta', 'En Proceso')
            GROUP BY s.nombre
        `, params);

        res.json({
            avgLeadTime,
            efficiency,
            openCount,
            closedCount,
            expiredCount,
            totalFinancialImpact: totalFinancialImpact.toFixed(2),
            totalInvestment: totalInvestment.toFixed(2),
            totalLoss: totalLoss.toFixed(2),
            impactByState,
            recruiterWorkload,
            geoDistribution
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single vacante
router.get('/:id', verifyToken, requireRole(allowedRolesRead), async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM vacantes WHERE id = ? AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Vacante no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Create Vacante (Supports Batch)
router.post('/', verifyToken, requireRole(allowedRolesWrite), async (req, res) => {
    const {
        codigo_requisicion, puesto_nombre, proceso_id, sede_id,
        fecha_apertura, fecha_cierre_estimada, prioridad,
        responsable_rh, presupuesto_aprobado, salario_base, costo_vacante, observaciones,
        dias_sla_meta, salario_base_ofrecido, costo_final_contratacion, costo_examenes_medicos,
        cantidad = 1, periodo = 'Actual'
    } = req.body;

    const qty = parseInt(cantidad) || 1;
    const results = [];
    const errors = [];

    // Parse the starting code (e.g. "REQ-015")
    // stored as base for incrementing
    let baseCodePrefix = 'REQ-';
    let baseCodeNum = 0;

    if (codigo_requisicion && codigo_requisicion.includes('-')) {
        const parts = codigo_requisicion.split('-');
        baseCodePrefix = parts[0] + '-';
        baseCodeNum = parseInt(parts[1]);
    } else {
        // Fallback if format is weird, though frontend sends REQ-XXX
        baseCodeNum = 1;
    }

    try {
        for (let i = 0; i < qty; i++) {
            // Generate code for this iteration
            // Iteration 0 uses the exact code sent by user (or derived base)
            // Iteration 1+ increments
            const currentNum = baseCodeNum + i;
            const currentCode = `${baseCodePrefix}${currentNum.toString().padStart(3, '0')}`;

            // Check duplicate for this specific code
            const [existing] = await pool.query('SELECT id FROM vacantes WHERE codigo_requisicion = ?', [currentCode]);
            if (existing.length > 0) {
                errors.push(`El código ${currentCode} ya existe.`);
                continue; // Skip this one or fail? Let's skip to try to process others or just log error.
                // If user asked for 5 and 1 exists, maybe we should stop? 
                // But for "Mass Creation" usually we want best effort or strict.
                // Let's assume strict uniqueness is required but we try to proceed with valid ones or fail?
                // Given the user prompt, let's try to insure we insert 5.
                // If collision, maybe we should skip to next number? 
                // Simple approach: Error if collision.
            }

            // Dates validation (only once needed really but checked per item if we wanted to vary dates)
            if (new Date(fecha_cierre_estimada) < new Date(fecha_apertura)) {
                errors.push(`Fecha cierre menor a apertura para ${currentCode}`);
                continue;
            }

            const [result] = await pool.query(`
                INSERT INTO vacantes 
                (codigo_requisicion, puesto_nombre, proceso_id, sede_id, fecha_apertura, fecha_cierre_estimada, prioridad, responsable_rh, presupuesto_aprobado, salario_base, costo_vacante, observaciones, dias_sla_meta, salario_base_ofrecido, costo_final_contratacion, costo_examenes_medicos, created_by, periodo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [currentCode, puesto_nombre, proceso_id, sede_id, fecha_apertura, fecha_cierre_estimada, prioridad, responsable_rh, presupuesto_aprobado, salario_base || 0, costo_vacante || 0, observaciones, dias_sla_meta || 15, salario_base_ofrecido || 0, costo_final_contratacion || 0, costo_examenes_medicos || 0, req.user.id, periodo]);

            results.push(result.insertId);

            // 🌐 AUTO-PUBLISH TO PUBLIC PORTAL IF STATUS IS "Abierta"
            // This makes the vacancy automatically visible in the public job portal
            try {
                // Check if this vacancy should be public (estado = 'Abierta')
                const [newVacancy] = await pool.query('SELECT estado, puesto_nombre FROM vacantes WHERE id = ?', [result.insertId]);

                if (newVacancy.length > 0 && newVacancy[0].estado === 'Abierta') {
                    // Generate unique slug
                    const baseSlug = newVacancy[0].puesto_nombre
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "") // Remove accents
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');

                    const slug = `${baseSlug}-${result.insertId}`;

                    // Insert into public_job_postings
                    await pool.query(`
                        INSERT INTO public_job_postings 
                        (vacante_id, slug, is_public, views_count, applications_count, is_featured)
                        VALUES (?, ?, TRUE, 0, 0, FALSE)
                    `, [result.insertId, slug]);

                    console.log(`✅ Auto-published vacancy ${currentCode} to public portal with slug: ${slug}`);
                }
            } catch (publishError) {
                console.error(`⚠️ Warning: Could not auto-publish vacancy ${currentCode}:`, publishError.message);
            }

            // 📧 NOTIFY RECRUITERS
            try {
                // Individual validation: Look for the specific email of the assigned responsible
                const [recruiters] = await pool.query(`
                    SELECT email FROM users 
                    WHERE full_name = ? AND tenant_id = ?
                `, [responsable_rh, req.user.tenantId]);

                if (recruiters.length > 0) {
                    const vacancyData = {
                        id: result.insertId,
                        puesto_nombre,
                        codigo_requisicion: currentCode,
                        prioridad,
                        fecha_apertura
                    };
                    emailService.sendNewVacancyNotification(recruiters, vacancyData, req.user.fullName)
                        .catch(e => console.error('Background email error:', e));
                } else {
                    console.log(`ℹ️ No se envió correo: No se encontró usuario con nombre "${responsable_rh}" en esta organización.`);
                }
            } catch (emailError) {
                console.error('⚠️ Could not send recruitment notification:', emailError.message);
            }
        }

        if (results.length === 0 && errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        res.json({ message: `${results.length} vacantes creadas exitosamente`, details: errors });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT Update Vacante
router.put('/:id', verifyToken, requireRole(allowedRolesWrite), async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Auto status update logic
    if (updates.estado && updates.estado !== 'Cubierta') {
        // If manually changing to open/in-process, clear the close date
        updates.fecha_cierre_real = null;
    } else if (updates.fecha_cierre_real) {
        // Only force 'Cubierta' if a close date is provided AND state wasn't explicitly set to something else
        updates.estado = 'Cubierta';
    }

    try {
        console.log('Update Request for Vacante ID:', id);
        console.log('Original Updates:', updates);

        // Construct dynamic query - filter out fields that don't belong to the table (like joins)
        const allowedFields = [
            'codigo_requisicion', 'puesto_nombre', 'proceso_id', 'sede_id',
            'fecha_apertura', 'fecha_cierre_estimada', 'fecha_cierre_real',
            'estado', 'prioridad', 'responsable_rh', 'presupuesto_aprobado',
            'salario_base', 'costo_vacante', 'observaciones',
            'dias_sla_meta', 'salario_base_ofrecido', 'costo_final_contratacion',
            'costo_dia_vacante', 'presupuesto_max', 'salario_pactado', 'dias_desfase', 'sla_meta',
            'proyecto_id', 'centro_costo_id', 'subcentro_id', 'tipo_trabajo_id', 'tipo_proyecto_id', 'costo_examenes_medicos', 'periodo'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                let val = updates[key];

                // 1. Convert empty/undefined to null
                if (val === '' || val === undefined || val === null) {
                    filteredUpdates[key] = null;
                }
                // 2. NASA Fix: Truncate ISO dates to YYYY-MM-DD
                else if (['fecha_apertura', 'fecha_cierre_estimada', 'fecha_cierre_real'].includes(key)) {
                    if (typeof val === 'string' && val.includes('T')) {
                        filteredUpdates[key] = val.split('T')[0];
                    } else {
                        filteredUpdates[key] = val;
                    }
                }
                // 3. Ensure numbers are numbers
                else if (['presupuesto_aprobado', 'salario_base', 'costo_vacante', 'proceso_id', 'sede_id', 'costo_examenes_medicos'].includes(key)) {
                    // Check if it's a valid number string or number
                    if (!isNaN(parseFloat(val)) && isFinite(val)) {
                        filteredUpdates[key] = Number(val);
                    } else {
                        // If it's something weird but not null/empty (which was caught above), keep it 
                        // or set to null if strictly invalid? Let's keep strict null for invalid numbers if intended.
                        // Actually, for now, let's just pass it if it's not empty, relying on above check.
                        // But to be safe like candidates:
                        filteredUpdates[key] = val;
                    }
                }
                else {
                    filteredUpdates[key] = val;
                }
            }
        });

        console.log('Filtered Updates:', filteredUpdates);

        const fields = Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates), id];

        if (fields.length === 0) return res.json({ message: 'No updates provided' });


        await pool.query(`UPDATE vacantes SET ${fields} WHERE id = ?`, values);

        // 🌐 AUTO-PUBLISH TO PUBLIC PORTAL IF STATUS CHANGED TO "Abierta"
        if (filteredUpdates.estado === 'Abierta') {
            try {
                // Check if already in public_job_postings
                const [existingPost] = await pool.query(
                    'SELECT id, is_public FROM public_job_postings WHERE vacante_id = ?',
                    [id]
                );

                if (existingPost.length > 0) {
                    // Update to make it public
                    if (!existingPost[0].is_public) {
                        await pool.query(
                            'UPDATE public_job_postings SET is_public = TRUE WHERE vacante_id = ?',
                            [id]
                        );
                        console.log(`✅ Vacancy ${id} re-published to public portal`);
                    }
                } else {
                    // Create new public posting
                    const [vacancy] = await pool.query('SELECT puesto_nombre FROM vacantes WHERE id = ?', [id]);
                    if (vacancy.length > 0) {
                        const baseSlug = vacancy[0].puesto_nombre
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '');

                        const slug = `${baseSlug}-${id}`;

                        await pool.query(`
                            INSERT INTO public_job_postings 
                            (vacante_id, slug, is_public, views_count, applications_count, is_featured)
                            VALUES (?, ?, TRUE, 0, 0, FALSE)
                        `, [id, slug]);

                        console.log(`✅ Vacancy ${id} published to public portal with slug: ${slug}`);
                    }
                }
            } catch (publishError) {
                console.error(`⚠️ Warning: Could not auto-publish vacancy ${id}:`, publishError.message);
            }
        }

        // Hide from public portal if status changed to non-Abierta
        if (filteredUpdates.estado && filteredUpdates.estado !== 'Abierta') {
            try {
                await pool.query(
                    'UPDATE public_job_postings SET is_public = FALSE WHERE vacante_id = ?',
                    [id]
                );
                console.log(`🔒 Vacancy ${id} removed from public portal (status: ${filteredUpdates.estado})`);
            } catch (hideError) {
                console.error(`⚠️ Warning: Could not hide vacancy ${id}:`, hideError.message);
            }
        }

        res.json({ message: 'Vacante actualizada correctamente' });
    } catch (error) {
        console.error('Error updating vacante:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE Vacante (Soft Delete)
router.delete('/:id', verifyToken, requireRole(allowedRolesWrite), async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete the vacante instead of hard deleting and destroying all histories
        const [result] = await pool.query('UPDATE vacantes SET deleted_at = NOW(), estado = "Cancelada" WHERE id = ? AND deleted_at IS NULL', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vacante no encontrada o ya eliminada' });
        }
        
        await pool.query('UPDATE public_job_postings SET is_public = FALSE WHERE vacante_id = ?', [id]).catch(e => null);

        await auditService.log(
            req.user?.id || null,
            req.user?.email || null,
            'vacantes',
            id,
            'DELETE (Soft)',
            { note: 'Vacante movida a papelera y despublicada' },
            req.ip
        );

        res.json({ message: 'Vacante almacenada en papelera correctamente' });
    } catch (error) {
        console.error('Error soft deleting vacante:', error);
        res.status(500).json({ error: 'No se pudo eliminar la vacante debido a un error de sistema.' });
    }
});

module.exports = router;
