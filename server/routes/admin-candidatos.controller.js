/**
 * Admin Candidatos Controller
 * Endpoints para gestionar candidatos del ERP
 */

const db = require('../db');
const previewData = require('./import_candidates_preview');

// ✅ GET /api/admin/candidatos/preview
// Retorna vista previa de datos a importar
exports.getPreview = async (req, res) => {
    try {
        // Re-procesar los datos
        previewData.procesarCandidatos();
        previewData.procesarRequisiciones();
        previewData.procesarAspirantes();
        previewData.procesarContrataciones();

        const datos = {
            candidatos: previewData.candidatos(),
            requisiciones: previewData.requisiciones(),
            aspirantes: previewData.aspirantes(),
            contrataciones: previewData.contrataciones()
        };

        return res.json({
            exito: true,
            resumen: {
                candidatos: datos.candidatos.length,
                requisiciones: datos.requisiciones.length,
                aspirantes: datos.aspirantes.length,
                contrataciones: datos.contrataciones.length
            },
            datos
        });

    } catch (error) {
        console.error('Error en getPreview:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// ✅ GET /api/admin/candidatos
// Retorna candidatos en base de datos
exports.getCandidatos = async (req, res) => {
    try {
        const [candidatos] = await db.query(`
            SELECT 
                c.id, c.identificacion, c.tipo_id, 
                CONCAT(c.primer_nombre, ' ', IFNULL(c.segundo_nombre, ''), ' ', 
                       c.primer_apellido, ' ', IFNULL(c.segundo_apellido, '')) as nombre,
                c.email, c.telefono, c.municipio_ciudad, c.departamento,
                c.fecha_nacimiento, c.genero, c.nivel_academico, c.estado_civil,
                c.tiene_hijos, c.cantidad_hijos, c.fecha_registro, c.fuente,
                IF(v.id IS NOT NULL, 1, 0) as vinculado,
                IF(v.id IS NOT NULL, 1, 0) as registrado_en_sistema
            FROM erp_candidatos c
            LEFT JOIN erp_vinculaciones v ON c.id = v.candidato_erp_id
            ORDER BY c.fecha_registro DESC
            LIMIT 100
        `);

        // Convertir valores 1/0 a booleanos para compatibilidad con el frontend
        const candidatosConBool = candidatos.map(c => ({
            ...c,
            vinculado: !!c.vinculado,
            registrado_en_sistema: !!c.registrado_en_sistema
        }));

        return res.json({
            exito: true,
            cantidad: candidatosConBool.length,
            candidatos: candidatosConBool
        });

    } catch (error) {
        console.error('Error en getCandidatos:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// ✅ GET /api/admin/candidatos/:cedula
// Retorna detalle de un candidato
exports.getDetalleCandidato = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [candidatos] = await db.query(
            `SELECT * FROM erp_candidatos WHERE identificacion = ?`,
            [cedula]
        );

        if (candidatos.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Candidato no encontrado' });
        }

        const candidato = candidatos[0];

        // Obtener aspiraciones
        const [aspiraciones] = await db.query(
            `SELECT * FROM erp_aspirantes WHERE numero_cedula = ?`,
            [cedula]
        );

        // Obtener contrataciones
        const [contrataciones] = await db.query(
            `SELECT * FROM erp_contrataciones WHERE numero_cedula = ?`,
            [cedula]
        );

        // Obtener vinculación
        const [vinculaciones] = await db.query(
            `SELECT * FROM erp_vinculaciones WHERE numero_cedula = ?`,
            [cedula]
        );

        return res.json({
            exito: true,
            candidato: {
                ...candidato,
                aspiraciones,
                contrataciones,
                vinculacion: vinculaciones[0] || null
            }
        });

    } catch (error) {
        console.error('Error en getDetalleCandidato:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// ✅ POST /api/admin/candidatos/registrar
// Registra un candidato nuevo en la base de datos
exports.registrarCandidato = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const {
            identificacion,
            tipoID,
            nombres,
            apellidos,
            email,
            telefono,
            departamento,
            ciudad,
            nivel_academico,
            estado_civil,
            genero,
            fecha_nacimiento,
            tiene_hijos,
            cantidad_hijos
        } = req.body;

        // Validar campos requeridos
        if (!identificacion || !nombres || !apellidos) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Faltan campos requeridos (identificacion, nombres, apellidos)'
            });
        }

        // Verificar si ya existe
        const [existentes] = await connection.query(
            `SELECT id FROM erp_candidatos WHERE identificacion = ?`,
            [identificacion]
        );

        if (existentes.length > 0) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El candidato con esta cédula ya existe'
            });
        }

        // Insertar candidato
        await connection.query(
            `INSERT INTO erp_candidatos (
                identificacion, tipo_id, primer_nombre, primer_apellido,
                segundo_nombre, segundo_apellido, email, telefono,
                municipio_ciudad, departamento, fecha_nacimiento, genero,
                nivel_academico, estado_civil, tiene_hijos, cantidad_hijos,
                fuente, fecha_registro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL_REGISTRO', NOW())`,
            [
                identificacion, tipoID,
                nombres.split(' ')[0],
                apellidos.split(' ')[0],
                nombres.includes(' ') ? nombres.split(' ')[1] : null,
                apellidos.includes(' ') ? apellidos.split(' ')[1] : null,
                email, telefono, ciudad, departamento,
                fecha_nacimiento, genero, nivel_academico, estado_civil,
                tiene_hijos ? 1 : 0, cantidad_hijos || 0
            ]
        );

        return res.json({
            exito: true,
            mensaje: 'Candidato registrado exitosamente',
            identificacion
        });

    } catch (error) {
        console.error('Error en registrarCandidato:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    } finally {
        await connection.release();
    }
};

// ✅ POST /api/admin/candidatos/importar-masivo
// Importa todos los candidatos/requisiciones/aspirantes/contrataciones del Excel
exports.importarMasivo = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Procesar archivos
        previewData.procesarCandidatos();
        previewData.procesarRequisiciones();
        previewData.procesarAspirantes();
        previewData.procesarContrataciones();

        const candidatos = previewData.candidatos();
        const requisiciones = previewData.requisiciones();
        const aspirantes = previewData.aspirantes();
        const contrataciones = previewData.contrataciones();

        let cantidadCandidatos = 0;
        let cantidadRequisiciones = 0;
        let cantidadAspirantes = 0;
        let cantidadContrataciones = 0;

        const batchSize = 200;

        // 1. IMPORTAR CANDIDATOS
        if (candidatos.length > 0) {
            for (let i = 0; i < candidatos.length; i += batchSize) {
                const batch = candidatos.slice(i, i + batchSize);
                const values = batch.map(c => {
                    const namesArray = (c.nombres || '').split(' ');
                    const apellidosArray = (c.apellidos || '').split(' ');
                    return [
                        c.identificacion,
                        c.tipoID,
                        namesArray[0] || '',
                        namesArray[1] || null,
                        apellidosArray[0] || '',
                        apellidosArray[1] || null,
                        c.email,
                        c.telefono,
                        c.ciudad,
                        c.departamento,
                        c.fecha_nacimiento || null,
                        c.genero,
                        c.nivel_academico,
                        c.estado_civil,
                        c.tiene_hijos ? 1 : 0,
                        c.cantidad_hijos || 0,
                        c.documentos?.hoja_vida_pdf || null,
                        c.documentos?.cedula_pdf || null,
                        'ERP_IMPORT',
                        new Date()
                    ];
                });

                await connection.query(
                    `INSERT IGNORE INTO erp_candidatos (
                        identificacion, tipo_id, primer_nombre, segundo_nombre,
                        primer_apellido, segundo_apellido, email, telefono,
                        municipio_ciudad, departamento, fecha_nacimiento, genero,
                        nivel_academico, estado_civil, tiene_hijos, cantidad_hijos,
                        hoja_vida_pdf, cedula_pdf, fuente, fecha_registro
                    ) VALUES ?`,
                    [values]
                );
                cantidadCandidatos += batch.length;
            }
        }

        // 2. IMPORTAR REQUISICIONES
        if (requisiciones.length > 0) {
            for (let i = 0; i < requisiciones.length; i += batchSize) {
                const batch = requisiciones.slice(i, i + batchSize);
                const values = batch.map(r => [
                    r.idu_requisicion,
                    r.nombre_solicitante,
                    r.cedula_solicitante,
                    r.puesto_solicitado,
                    r.numero_vacantes,
                    r.jornada_laboral,
                    r.departamento,
                    r.nivel_educativo,
                    r.experiencia,
                    r.salario_oferta || null,
                    r.estado === 'Aprobado' ? 'Aprobado' : 'Pendiente',
                    new Date(),
                    r.observaciones
                ]);

                await connection.query(
                    `INSERT IGNORE INTO erp_requisiciones (
                        idu_requisicion, nombre_solicitante, cedula_solicitante,
                        puesto_solicitado, numero_vacantes, jornada_laboral,
                        lugar_trabajo, nivel_academico_requerido, experiencia_requerida,
                        salario_oferta, estado_requisicion, fecha_creacion, observaciones
                    ) VALUES ?`,
                    [values]
                );
                cantidadRequisiciones += batch.length;
            }
        }

        // 3. IMPORTAR ASPIRANTES
        if (aspirantes.length > 0) {
            for (let i = 0; i < aspirantes.length; i += batchSize) {
                const batch = aspirantes.slice(i, i + batchSize);
                const values = batch.map(a => [
                    a.idu_aspirante,
                    a.idu_requisicion,
                    a.numero_cedula,
                    `${a.nombres} ${a.apellidos}`,
                    a.email,
                    a.telefono,
                    a.puntaje_pruebas,
                    a.decision === 'Seleccionado' ? 'Seleccionado' : 'No seleccionado',
                    a.fecha_aplicacion || new Date().toISOString().split('T')[0],
                    a.observaciones
                ]);

                await connection.query(
                    `INSERT IGNORE INTO erp_aspirantes (
                        idu_aspirante, idu_requisicion, numero_cedula,
                        nombre_aspirante, email, telefono, puntaje_pruebas,
                        decision_final, fecha_aplicacion, observaciones
                    ) VALUES ?`,
                    [values]
                );
                cantidadAspirantes += batch.length;
            }
        }

        // 4. IMPORTAR CONTRATACIONES
        if (contrataciones.length > 0) {
            for (let i = 0; i < contrataciones.length; i += batchSize) {
                const batch = contrataciones.slice(i, i + batchSize);
                const values = batch.map(c => {
                    const docsJson = JSON.stringify(c.documentos || {});
                    return [
                        c.idu_contrato,
                        c.idu_aspirante,
                        c.idu_requisicion,
                        c.numero_cedula,
                        c.nombre_completo,
                        c.puesto_contratado,
                        c.email,
                        c.fecha_contrato || new Date().toISOString().split('T')[0],
                        c.salario_final || 0,
                        c.estado_contrato === 'Activo' ? 'Activo' : 'Inactivo',
                        docsJson,
                        c.fecha_inicio || null
                    ];
                });

                await connection.query(
                    `INSERT IGNORE INTO erp_contrataciones (
                        idu_contrato, idu_aspirante, idu_requisicion,
                        numero_cedula, nombre_contratado, puesto_contratado,
                        email, fecha_contrato, salario_final, estado_contrato,
                        documentos_pdf, fecha_inicio
                    ) VALUES ?`,
                    [values]
                );
                cantidadContrataciones += batch.length;
            }
        }

        // Hacer COMMIT
        await connection.commit();

        return res.json({
            exito: true,
            mensaje: 'Importación completada exitosamente',
            cantidad: cantidadCandidatos + cantidadRequisiciones + cantidadAspirantes + cantidadContrataciones,
            detalles: {
                candidatos: cantidadCandidatos,
                requisiciones: cantidadRequisiciones,
                aspirantes: cantidadAspirantes,
                contrataciones: cantidadContrataciones
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error en importarMasivo:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    } finally {
        await connection.release();
    }
};

// ✅ PUT /api/admin/candidatos/:cedula
// Actualiza datos de un candidato
exports.actualizarCandidato = async (req, res) => {
    try {
        const { cedula } = req.params;
        const datosActualizacion = req.body;

        // Validar que la cédula existe
        const [existe] = await db.query(
            `SELECT id FROM erp_candidatos WHERE identificacion = ?`,
            [cedula]
        );

        if (existe.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Candidato no encontrado' });
        }

        // Construir query dinámico
        const campos = [];
        const valores = [];

        for (const [key, value] of Object.entries(datosActualizacion)) {
            if (value !== undefined && value !== null) {
                campos.push(`${key} = ?`);
                valores.push(value);
            }
        }

        if (campos.length === 0) {
            return res.status(400).json({ exito: false, mensaje: 'No hay datos para actualizar' });
        }

        campos.push('fecha_actualizacion = NOW()');
        valores.push(cedula);

        await db.query(
            `UPDATE erp_candidatos SET ${campos.join(', ')} WHERE identificacion = ?`,
            valores
        );

        return res.json({
            exito: true,
            mensaje: 'Candidato actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error en actualizarCandidato:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// ✅ DELETE /api/admin/candidatos/:cedula
// Elimina un candidato (soft delete)
exports.eliminarCandidato = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [result] = await db.query(
            `DELETE FROM erp_candidatos WHERE identificacion = ?`,
            [cedula]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Candidato no encontrado' });
        }

        return res.json({
            exito: true,
            mensaje: 'Candidato eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error en eliminarCandidato:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};

// ✅ GET /api/admin/estadisticas
// Retorna estadísticas generales
exports.getEstadisticas = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM erp_candidatos) as total_candidatos,
                (SELECT COUNT(*) FROM erp_requisiciones) as total_requisiciones,
                (SELECT COUNT(*) FROM erp_aspirantes) as total_aspirantes,
                (SELECT COUNT(*) FROM erp_contrataciones) as total_contrataciones,
                (SELECT COUNT(*) FROM erp_vinculaciones) as total_vinculados,
                (SELECT COUNT(DISTINCT departamento) FROM erp_candidatos) as departamentos
        `);

        return res.json({
            exito: true,
            estadisticas: stats[0] || {}
        });

    } catch (error) {
        console.error('Error en getEstadisticas:', error);
        return res.status(500).json({ exito: false, mensaje: error.message });
    }
};
