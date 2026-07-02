/**
 * POST /api/apply/:token
 * Endpoint público — Sin autenticación requerida
 * Permite que candidatos externos se postulen a una vacante
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuración multer para CVs
const uploadDir = path.join(__dirname, '../public/uploads/cvs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cedula = req.body.cedula || 'nocedula';
        // Normalizar la extensión para evitar problemas
        cb(null, 'cv-' + cedula + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

const fileFilter = (req, file, cb) => {
    // Aceptar solo PDFs (por mimetype y extensión)
    const isValidExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    const isValidMime = file.mimetype === 'application/pdf';
    
    if (isValidExt && isValidMime) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos en formato PDF.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB de límite
    }
});

// ============================================================
// GET /api/apply/:token — Obtener info pública de la vacante
// SIN autenticación — acceso público
// ============================================================
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Buscar vacante por ID o código (token público)
        const [vacantes] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.observaciones,
                v.estado,
                v.prioridad,
                v.fecha_apertura,
                v.fecha_cierre_estimada,
                v.salario_base_ofrecido,
                s.nombre as sede_nombre,
                p.nombre as proceso_nombre
            FROM vacantes v
            LEFT JOIN sedes s ON v.sede_id = s.id
            LEFT JOIN procesos p ON v.proceso_id = p.id
            WHERE v.id = ? AND v.estado = 'Abierta'
        `, [parseInt(token)]);

        if (vacantes.length === 0) {
            return res.status(404).json({ error: 'Vacante no encontrada o no disponible' });
        }

        // Return only public info
        const v = vacantes[0];
        res.json({
            id: v.id,
            titulo: v.puesto_nombre,
            codigo: v.codigo_requisicion,
            descripcion: v.observaciones,
            estado: v.estado,
            ciudad: v.sede_nombre?.includes('Cartagena') ? 'Cartagena, Colombia' : (v.sede_nombre || 'Cartagena, Colombia'),
            sede: v.sede_nombre || 'Sede Principal',
            tipo_trabajo: 'Tiempo Completo', // Default since table might be empty
            proceso: v.proceso_nombre,
            fecha_apertura: v.fecha_apertura,
            fecha_cierre: v.fecha_cierre_estimada,
            salario: v.salario_base_ofrecido > 0 ? `$${parseFloat(v.salario_base_ofrecido).toLocaleString('es-CO')} COP` : 'A convenir',
            empresa: 'DISCOL S.A.S.',
            logo_empresa: null
        });

    } catch (error) {
        console.error('Error getting vacancy for apply:', error);
        res.status(500).json({ error: 'Error al cargar la vacante' });
    }
});

// ============================================================
// POST /api/apply/:token — Recibir postulación
// SIN autenticación — endpoint 100% público
// ============================================================
const AIMatchingEngine = require('../services/AIMatchingEngine');
const trackingService = require('../services/ApplicationTrackingService');

// Middleware para atrapar los errores de multer y responder con JSON estructurado
const uploadMiddleware = (req, res, next) => {
    upload.single('cv')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'El archivo CV supera el tamaño máximo permitido de 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

router.post('/:token', uploadMiddleware, async (req, res) => {
    try {
        const { token } = req.params;
        const {
            cedula,
            primer_nombre, segundo_nombre, 
            primer_apellido, segundo_apellido,
            email, telefono,
            ciudad_residencia, nivel_educativo, anos_experiencia,
            cargo_actual, empresa_actual, mensaje, como_se_entero, acepta_terminos,
            // Additional info (screenshot match)
            lugar_expedicion, fecha_expedicion, direccion, fecha_nacimiento,
            // New fields
            tipo_identificacion, grupo_etnico, genero, estado_civil,
            tiene_familiar, parentesco_familiar, nombre_familiar, cedula_familiar, telefono_familiar,
            tipo_vivienda, servicios_publicos, estrato,
            tipo_vehiculo, vehiculo_placa, vehiculo_marca_modelo, vehiculo_modelo_ano,
            vehiculo_nombre_propietario, vehiculo_cedula_propietario,
            // Academic info
            tiene_tarjeta_profesional, numero_tarjeta_profesional, formaciones: formacion_academica,
            // Step 4 (Labor, Family, Tools)
            historial_laboral, tiene_hijos, cantidad_hijos, cabeza_familia, discapacidad,
            dispuesto_celular, casco_integral, ano_matricula_moto
        } = req.body;

        if (!cedula) return res.status(400).json({ error: 'La cédula es requerida' });

        // Verificación de duplicado por cédula y vacante
        const [existingApp] = await pool.query(
            "SELECT id FROM candidatos_seguimiento WHERE vacante_id = ? AND cedula = ?",
            [parseInt(token), cedula]
        );
        if (existingApp.length > 0) {
            return res.status(400).json({ 
                error: 'Ya estás postulado a esta vacante. Si no tienes tu enlace de seguimiento, puedes recuperarlo.',
                duplicate: true,
                cedula: cedula
            });
        }

        const cv_url = req.file ? `/uploads/cvs/${req.file.filename}` : null;

        // Verificar vacante
        const [vacantes] = await pool.query(
            "SELECT id, puesto_nombre, codigo_requisicion, observaciones, tenant_id FROM vacantes WHERE id = ? AND estado = 'Abierta'",
            [parseInt(token)]
        );

        if (vacantes.length === 0) return res.status(404).json({ error: 'Vacante no disponible' });

        const vacante = vacantes[0];
        const nombreCompleto = `${primer_nombre.trim()} ${segundo_nombre?.trim() || ''} ${primer_apellido.trim()} ${segundo_apellido?.trim() || ''}`.replace(/\s+/g, ' ').trim();
        const emailLower = email.trim().toLowerCase();

        // 1. Insert in candidatos (master candidate record for the platform)
        const [result] = await pool.query(`
            INSERT INTO candidatos (
                cedula, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                email, telefono, ciudad, direccion, fecha_nacimiento,
                lugar_expedicion, fecha_expedicion, titulo_profesional, experiencia_total_anos,
                cv_url, estado, etapa,
                tipo_identificacion, grupo_etnico, genero, estado_civil,
                tiene_familiar, parentesco_familiar, nombre_familiar, cedula_familiar, telefono_familiar,
                tipo_vivienda, servicios_publicos, estrato,
                tipo_vehiculo, vehiculo_placa, vehiculo_marca_modelo, vehiculo_modelo_ano,
                vehiculo_nombre_propietario, vehiculo_cedula_propietario,
                tiene_tarjeta_profesional, numero_tarjeta_profesional, formacion_academica,
                historial_laboral, tiene_hijos, cantidad_hijos, cabeza_familia, discapacidad,
                dispuesto_celular, casco_integral, ano_matricula_moto
            ) VALUES (
                ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, 
                ?, 'Activo', 'Aplicación',
                ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                ?, ?, ?, 
                ?, ?, ?, ?, 
                ?, ?, 
                ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                ?, ?, ?
            )
            ON DUPLICATE KEY UPDATE 
                segundo_nombre = VALUES(segundo_nombre),
                primer_apellido = VALUES(primer_apellido),
                segundo_apellido = VALUES(segundo_apellido),
                telefono = VALUES(telefono), 
                cv_url = VALUES(cv_url), 
                direccion = VALUES(direccion),
                fecha_nacimiento = VALUES(fecha_nacimiento),
                lugar_expedicion = VALUES(lugar_expedicion),
                fecha_expedicion = VALUES(fecha_expedicion),
                tipo_identificacion = VALUES(tipo_identificacion),
                grupo_etnico = VALUES(grupo_etnico),
                genero = VALUES(genero),
                estado_civil = VALUES(estado_civil),
                tiene_familiar = VALUES(tiene_familiar),
                parentesco_familiar = VALUES(parentesco_familiar),
                nombre_familiar = VALUES(nombre_familiar),
                cedula_familiar = VALUES(cedula_familiar),
                telefono_familiar = VALUES(telefono_familiar),
                tipo_vivienda = VALUES(tipo_vivienda),
                servicios_publicos = VALUES(servicios_publicos),
                estrato = VALUES(estrato),
                tipo_vehiculo = VALUES(tipo_vehiculo),
                vehiculo_placa = VALUES(vehiculo_placa),
                vehiculo_marca_modelo = VALUES(vehiculo_marca_modelo),
                vehiculo_modelo_ano = VALUES(vehiculo_modelo_ano),
                vehiculo_nombre_propietario = VALUES(vehiculo_nombre_propietario),
                vehiculo_cedula_propietario = VALUES(vehiculo_cedula_propietario),
                tiene_tarjeta_profesional = VALUES(tiene_tarjeta_profesional),
                numero_tarjeta_profesional = VALUES(numero_tarjeta_profesional),
                formacion_academica = VALUES(formacion_academica),
                historial_laboral = VALUES(historial_laboral),
                tiene_hijos = VALUES(tiene_hijos),
                cantidad_hijos = VALUES(cantidad_hijos),
                cabeza_familia = VALUES(cabeza_familia),
                discapacidad = VALUES(discapacidad),
                dispuesto_celular = VALUES(dispuesto_celular),
                casco_integral = VALUES(casco_integral),
                ano_matricula_moto = VALUES(ano_matricula_moto)
        `, [
            cedula?.trim(), primer_nombre?.trim(), segundo_nombre?.trim(), primer_apellido?.trim(), segundo_apellido?.trim(),
            emailLower, telefono?.trim(), ciudad_residencia?.trim() || 'Cartagena', direccion?.trim(), fecha_nacimiento || null,
            lugar_expedicion?.trim(), fecha_expedicion || null, cargo_actual?.trim() || '', parseInt(anos_experiencia) || 0,
            cv_url,
            tipo_identificacion, grupo_etnico, genero, estado_civil,
            tiene_familiar, parentesco_familiar, nombre_familiar, cedula_familiar, telefono_familiar,
            tipo_vivienda, servicios_publicos, estrato,
            tipo_vehiculo, vehiculo_placa, vehiculo_marca_modelo, vehiculo_modelo_ano,
            vehiculo_nombre_propietario, vehiculo_cedula_propietario,
            tiene_tarjeta_profesional, numero_tarjeta_profesional, 
            typeof formacion_academica === 'string' ? formacion_academica : JSON.stringify(formacion_academica),
            typeof historial_laboral === 'string' ? historial_laboral : JSON.stringify(historial_laboral),
            tiene_hijos || 'No', parseInt(cantidad_hijos) || 0, cabeza_familia || 'No', discapacidad || 'No tengo',
            dispuesto_celular || 'No', casco_integral || 'No', ano_matricula_moto
        ]);

        const candidatoId = result.insertId || (await pool.query('SELECT id FROM candidatos WHERE email = ?', [emailLower]))[0][0].id;

        // 3. Insert in candidatos_seguimiento (this is what recruiters see in their dashboard - initially pending)
        let seguimientoId = null;
        try {
            const [segResult] = await pool.query(`
                INSERT INTO candidatos_seguimiento (
                    vacante_id, cedula, nombre_candidato, etapa_actual, fuente_reclutamiento, 
                    fecha_postulacion, score_tecnico_ia, resumen_ia_entrevista, cv_url
                ) VALUES (?, ?, ?, 'Postulación', 'Portal', NOW(), 0, ?, ?)
            `, [
                vacante.id, cedula?.trim(), nombreCompleto, JSON.stringify('Evaluación pendiente'), cv_url
            ]);
            seguimientoId = segResult.insertId;
        } catch (e) {
            console.log('Skipping seguimiento insert:', e.message);
        }

        // 4. Insert into 'applications' table (for tracking and platform flow - initially pending)
        let applicationId = null;
        try {
            const [appResult] = await pool.query(`
                INSERT INTO applications (
                    vacante_id, candidato_id, nombre, email, telefono, cv_url,
                    auto_match_score, estado, fecha_postulacion, application_source
                ) VALUES (?, ?, ?, ?, ?, ?, 0, 'Nueva', NOW(), 'Portal Anónimo')
            `, [
                vacante.id, candidatoId, nombreCompleto, emailLower, telefono?.trim(), cv_url
            ]);
            applicationId = appResult.insertId;
        } catch (e) {
            console.log('Skipping applications insert:', e.message);
        }

        // 5. Create Tracking Link
        let trackingUrl = '';
        if (applicationId) {
            try {
                const trackingResult = await trackingService.createTrackingLink(applicationId);
                trackingUrl = trackingResult.trackingUrl;
            } catch (e) {
                console.log('Error creating tracking link:', e.message);
            }
        }

        // 6. Responder de inmediato al candidato
        res.json({
            success: true,
            message: `¡Gracias ${primer_nombre}! Postulación recibida.`,
            trackingUrl: trackingUrl
        });

        // 🚀 PROCESAMIENTO EN SEGUNDO PLANO (ASÍNCRONO): AI MATCHING Y NOTIFICACIONES
        (async () => {
            let aiResult = { score: 0, recommendation: 'Evaluación pendiente' };
            try {
                console.log(`[AI Background] Analizando compatibilidad de ${nombreCompleto} para ${vacante.puesto_nombre}...`);
                const candidateProfile = {
                    nombre: nombreCompleto,
                    email: emailLower,
                    titulo_actual: cargo_actual,
                    empresa_actual: empresa_actual,
                    experiencia_anos: parseInt(anos_experiencia) || 0,
                    educacion: nivel_educativo,
                    ubicacion: ciudad_residencia,
                    skills: [cargo_actual, nivel_educativo].filter(Boolean)
                };

                aiResult = await AIMatchingEngine.scoreCandidate(candidateProfile, vacante.observaciones || vacante.puesto_nombre);

                // 1. Actualizar puntuación en applications
                if (applicationId) {
                    await pool.query(
                        "UPDATE applications SET auto_match_score = ? WHERE id = ?",
                        [aiResult.score || 0, applicationId]
                    );
                }

                // 2. Actualizar puntuación y recomendación en candidatos_seguimiento
                if (seguimientoId) {
                    await pool.query(
                        "UPDATE candidatos_seguimiento SET score_tecnico_ia = ?, resumen_ia_entrevista = ? WHERE id = ?",
                        [aiResult.score || 0, JSON.stringify(aiResult.recommendation), seguimientoId]
                    );
                }

                // 3. Guardar en sourced_candidates
                await pool.query(`
                    INSERT INTO sourced_candidates (
                        nombre, email, telefono, cv_text, ai_match_score, ai_analysis, estado
                    ) VALUES (?, ?, ?, ?, ?, ?, 'new')
                    ON DUPLICATE KEY UPDATE ai_match_score = VALUES(ai_match_score), ai_analysis = VALUES(ai_analysis)
                `, [
                    nombreCompleto, emailLower, telefono?.trim(),
                    `Candidato aplicado vía web. Cargo: ${cargo_actual}. Exp: ${anos_experiencia}. Mensaje: ${mensaje}`,
                    aiResult.score || 0, JSON.stringify(aiResult)
                ]);

                // 4. Crear notificación para Admin con el puntaje definitivo
                const metadata = {
                    candidate: {
                        id: seguimientoId,
                        primer_nombre,
                        primer_apellido,
                        segundo_nombre,
                        segundo_apellido,
                        email: emailLower,
                        telefono,
                        ciudad: ciudad_residencia,
                        direccion,
                        fecha_nacimiento,
                        educacion: nivel_educativo,
                        experiencia: anos_experiencia,
                        cargo: cargo_actual,
                        score: aiResult.score
                    },
                    vacante: {
                        id: vacante.id,
                        puesto: vacante.puesto_nombre,
                        codigo: vacante.codigo_requisicion
                    }
                };

                await pool.query(`
                    INSERT INTO notifications (tipo, titulo, mensaje, metadata, user_type, user_id, tenant_id)
                    VALUES ('nueva_postulacion', ?, ?, ?, 'admin', 1, ?)
                `, [
                    `Nueva postulación: ${vacante.puesto_nombre}`,
                    `${nombreCompleto} se ha postulado. Score IA: ${aiResult.score}%`,
                    JSON.stringify(metadata),
                    vacante.tenant_id
                ]);

                // 5. Enviar email de confirmación
                if (emailLower && trackingUrl) {
                    const EmailService = require('../services/EmailService');
                    EmailService.sendApplicationConfirmation(
                        emailLower,
                        `${primer_nombre.trim()} ${primer_apellido.trim()}`,
                        vacante.puesto_nombre,
                        trackingUrl
                    ).catch(err => console.error('❌ Error enviando email de confirmación en background:', err));
                }

                console.log(`[AI Background] ✅ Finalizado análisis para candidato ${nombreCompleto}. Score: ${aiResult.score}`);

            } catch (bgErr) {
                console.error('[AI Background] Error procesando compatibilidad:', bgErr.message);
            }
        })().catch(e => console.error('[AI Background] Error crítico en promesa:', e));

    } catch (error) {
        console.error('Error in apply:', error);
        res.status(500).json({ error: 'Error al procesar postulación' });
    }
});


// ============================================================
// POST /api/apply/:token/recover — Recuperar enlace de seguimiento
// ============================================================
router.post('/:token/recover', async (req, res) => {
    try {
        const { token } = req.params;
        const { cedula } = req.body;

        if (!cedula) return res.status(400).json({ error: 'La cédula es requerida' });

        const [links] = await pool.query(`
            SELECT atl.tracking_token, a.email, a.nombre, v.puesto_nombre
            FROM application_tracking_links atl
            INNER JOIN applications a ON atl.application_id = a.id
            INNER JOIN vacantes v ON a.vacante_id = v.id
            INNER JOIN candidatos c ON a.candidato_id = c.id
            WHERE a.vacante_id = ? AND c.cedula = ?
        `, [parseInt(token), cedula]);

        if (links.length === 0) {
            return res.status(404).json({ error: 'No se encontró una postulación activa o el enlace expiró' });
        }

        const linkData = links[0];
        
        // Generate Tracking URL
        const trackingService = require('../services/ApplicationTrackingService');
        const trackingUrl = trackingService.generateTrackingUrl(linkData.tracking_token);

        // Enviar email transaccional de recuperación
        if (linkData.email && trackingUrl) {
            const EmailService = require('../services/EmailService');
            EmailService.sendApplicationConfirmation(
                linkData.email,
                linkData.nombre,
                linkData.puesto_nombre,
                trackingUrl
            ).catch(err => console.error('❌ Error enviando email de recuperación:', err));
        }

        res.json({ success: true, message: 'Enlace enviado exitosamente al correo registrado.' });

    } catch (error) {
        console.error('Error in recover:', error);
        res.status(500).json({ error: 'Error al recuperar postulación' });
    }
});


// ============================================================
// GET /api/apply — Lista de vacantes abiertas (público)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const [vacantes] = await pool.query(`
            SELECT 
                v.id,
                v.puesto_nombre,
                v.codigo_requisicion,
                v.observaciones,
                v.prioridad,
                v.fecha_apertura,
                v.fecha_cierre_estimada,
                v.salario_base_ofrecido,
                s.nombre as sede_nombre
            FROM vacantes v
            LEFT JOIN sedes s ON v.sede_id = s.id
            WHERE v.estado = 'Abierta'
            ORDER BY v.prioridad DESC, v.fecha_apertura DESC
        `);

        res.json({
            empresa: 'DISCOL S.A.S.',
            ciudad: 'Cartagena, Colombia',
            total_vacantes: vacantes.length,
            vacantes: vacantes.map(v => ({
                id: v.id,
                titulo: v.puesto_nombre,
                codigo: v.codigo_requisicion,
                sede: v.sede_nombre,
                ciudad: v.sede_nombre?.includes('Cartagena') ? 'Cartagena' : (v.sede_nombre || 'Cartagena'),
                tipo: 'Tiempo Completo',
                salario: v.salario_base_ofrecido > 0 ? `$${parseFloat(v.salario_base_ofrecido).toLocaleString('es-CO')} COP` : 'A convenir',
                fecha_cierre: v.fecha_cierre_estimada,
                prioridad: v.prioridad,
                link_postulacion: `/aplicar/${v.id}`
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
