/**
 * ERP DATA IMPORT SCRIPT
 * Importa datos desde los 4 archivos Excel DISCOL al schema ERP
 * Fecha: 2026-03-25
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sistema_gestion_talento',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const EXCEL_FILES = {
    candidatos: 'Lista de Hoja de Vida (1).xlsx',
    requisiciones: 'Listado de Requisiciones de Personal.xlsx',
    aspirantes: 'Lista de Registros de Apirantes.xlsx',
    contrataciones: 'Lista de Registros de Contratacion.xlsx'
};

// =====================================================
// UTILIDADES
// =====================================================

const log = {
    info: (msg) => console.log(`[ℹ️  INFO] ${msg}`),
    success: (msg) => console.log(`[✅ SUCCESS] ${msg}`),
    error: (msg) => console.error(`[❌ ERROR] ${msg}`),
    warn: (msg) => console.warn(`[⚠️  WARN] ${msg}`),
    count: (type, count) => console.log(`[📊 ${type}] ${count} registros procesados`)
};

const cleanCell = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value.trim() || null;
    return value;
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const parseNumber = (num) => {
    if (num === null || num === undefined) return null;
    const parsed = Number(num);
    return isNaN(parsed) ? null : parsed;
};

// =====================================================
// 1. IMPORTAR CANDIDATOS
// =====================================================

async function importCandidatos(connection, workbook) {
    log.info('Importando CANDIDATOS desde Hoja de Vida...');
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { 
        header: 1,
        defval: null,
        blankrows: false
    });
    
    // Skip header row (row 1 es headers reales con posición en row index 1)
    const headerRow = data[1];
    const dataRows = data.slice(2);
    
    if (!dataRows.length) {
        log.warn('No hay datos de candidatos para importar');
        return 0;
    }
    
    // Map columns by finding headers
    const colMap = {
        identificacion: headerRow.indexOf('Identificacion'),
        tipoId: headerRow.indexOf('Tipo Id— Filtrar por Tipo Id —CedulaCedula ExtrajeriaTarjeta Identidad'),
        lugarExpedicion: headerRow.indexOf('Lugar de Expedicion'),
        fechaExpedicion: headerRow.indexOf('Fecha de Expedicion Documento'),
        primerNombre: headerRow.indexOf('Primer Nombre'),
        segundoNombre: headerRow.indexOf('Segundo Nombre'),
        primerApellido: headerRow.indexOf('Primer Apellido'),
        segundoApellido: headerRow.indexOf('Segundo Apellido'),
        email: headerRow.indexOf('Email'),
        telefono: headerRow.indexOf('Teléfono'),
        municipioCiudad: headerRow.indexOf('Municipio/Ciudad de Residencia'),
        direccion: headerRow.indexOf('Direccion'),
        fechaNacimiento: headerRow.indexOf('Fecha de Nacimiento'),
        genero: headerRow.indexOf('Genero— Filtrar por Genero —HombreMujerOtro'),
        nivelAcademico: headerRow.indexOf('Nivel Academico— Filtrar por Nivel Academico'),
        hojaVidaPdf: headerRow.indexOf('Hoja de Vida (PDF)'),
        cedulaPdf: headerRow.indexOf('Cedula (PDF)')
    };
    
    let imported = 0;
    let errors = 0;
    
    for (const row of dataRows) {
        try {
            const identificacion = cleanCell(row[colMap.identificacion]);
            
            if (!identificacion) continue;  // Skip empty rows
            
            const values = [
                identificacion,
                cleanCell(row[colMap.tipoId]) || 'Cedula',
                cleanCell(row[colMap.lugarExpedicion]),
                parseDate(row[colMap.fechaExpedicion]),
                cleanCell(row[colMap.primerNombre]),
                cleanCell(row[colMap.segundoNombre]),
                cleanCell(row[colMap.primerApellido]),
                cleanCell(row[colMap.segundoApellido]),
                cleanCell(row[colMap.email]),
                cleanCell(row[colMap.telefono]),
                cleanCell(row[colMap.municipioCiudad]),
                null,  // departamento (no está en excel)
                cleanCell(row[colMap.direccion]),
                parseDate(row[colMap.fechaNacimiento]),
                cleanCell(row[colMap.genero]),
                null,  // grupo_etnico (puede extraerse pero complex)
                null,  // estado_civil
                cleanCell(row[colMap.nivelAcademico]),
                0,     // tiene_tarjeta_prof
                null,  // numero_tarjeta_prof
                0,     // tiene_hijos
                0,     // cantidad_hijos
                0,     // es_cabeza_familia
                0,     // tiene_discapacidad
                null,  // tipo_discapacidad
                cleanCell(row[colMap.hojaVidaPdf]),
                cleanCell(row[colMap.cedulaPdf])
            ];
            
            const sql = `
                INSERT IGNORE INTO erp_candidatos (
                    identificacion, tipo_id, lugar_expedicion, fecha_expedicion,
                    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                    email, telefono, municipio_ciudad, departamento, direccion,
                    fecha_nacimiento, genero, grupo_etnico, estado_civil,
                    nivel_academico, tiene_tarjeta_prof, numero_tarjeta_prof,
                    tiene_hijos, cantidad_hijos, es_cabeza_familia,
                    tiene_discapacidad, tipo_discapacidad,
                    hoja_vida_pdf, cedula_pdf
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(sql, values);
            imported++;
            
        } catch (err) {
            errors++;
            log.warn(`Error importando candidato en fila: ${err.message}`);
        }
    }
    
    log.count('CANDIDATOS', imported);
    if (errors > 0) log.warn(`${errors} errores encontrados`);
    return imported;
}

// =====================================================
// 2. IMPORTAR REQUISICIONES
// =====================================================

async function importRequisiciones(connection, workbook) {
    log.info('Importando REQUISICIONES...');
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    const headerRow = data[1];
    const dataRows = data.slice(2);
    
    if (!dataRows.length) {
        log.warn('No hay datos de requisiciones para importar');
        return 0;
    }
    
    // Map columns
    const findCol = (name) => headerRow.findIndex(h => h && h.includes(name));
    
    let imported = 0;
    let errors = 0;
    
    for (const row of dataRows) {
        try {
            const iduRequisicion = cleanCell(row[0]);  // Usually first column
            
            if (!iduRequisicion || !iduRequisicion.startsWith('RP')) continue;
            
            const values = [
                iduRequisicion,
                cleanCell(row[2]) || 'No especificado',  // nombre_solicitante
                null,  // cedula_solicitante
                cleanCell(row[4]),  // puesto_solicitado
                parseNumber(row[3]) || 1,  // numero_vacantes
                cleanCell(row[5]),  // jornada_laboral
                cleanCell(row[6]),  // lugar_trabajo
                cleanCell(row[9]),  // tipo_contrato
                cleanCell(row[11]),  // duracion_contrato
                null,  // nivel_academico_requerido
                null,  // experiencia_requerida
                0,  // requiere_vehiculo
                cleanCell(row[15]),  // tipo_vehiculo
                0,  // requiere_licencia
                cleanCell(row[16]),  // tipo_licencia
                cleanCell(row[17]) === 'Si' ? 1 : 0,  // requiere_celular
                parseNumber(row[13]) || null,  // salario_ofrecido
                cleanCell(row[14]) === 'Si' ? 1 : 0,  // bono_salarial
                cleanCell(row[10]),  // area_proyecto
                cleanCell(row[7]),  // motivo_solicitud
                cleanCell(row[20]) === 'Si' ? 1 : 0,  // requiere_padrino_acogida
                cleanCell(row[22]),  // nombre_padrino
                null,  // cedula_padrino
                cleanCell(row[21]) || 'Pendiente',  // estatus_aprobacion
                cleanCell(row[18]),  // requerimientos_adicionales
                cleanCell(row[19]),  // observaciones
                parseDate(row[1]),  // fecha_requisicion
                null,  // paso_flujo
                cleanCell(row[25])  // enlace_detalle
            ];
            
            const sql = `
                INSERT IGNORE INTO erp_requisiciones (
                    idu_requisicion, nombre_solicitante, cedula_solicitante,
                    puesto_solicitado, numero_vacantes, jornada_laboral,
                    lugar_trabajo, tipo_contrato, duracion_contrato,
                    nivel_academico_requerido, experiencia_requerida,
                    requiere_vehiculo, tipo_vehiculo, requiere_licencia,
                    tipo_licencia, requiere_celular, salario_ofrecido,
                    bono_salarial, area_proyecto, motivo_solicitud,
                    requiere_padrino_acogida, nombre_padrino, cedula_padrino,
                    estatus_aprobacion, requerimientos_adicionales,
                    observaciones, fecha_requisicion, paso_flujo,
                    enlace_detalle
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(sql, values);
            imported++;
            
        } catch (err) {
            errors++;
            log.warn(`Error en requisición: ${err.message}`);
        }
    }
    
    log.count('REQUISICIONES', imported);
    if (errors > 0) log.warn(`${errors} errores encontrados`);
    return imported;
}

// =====================================================
// 3. IMPORTAR ASPIRANTES
// =====================================================

async function importAspirantes(connection, workbook) {
    log.info('Importando ASPIRANTES...');
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    const headerRow = data[1];
    const dataRows = data.slice(2);
    
    if (!dataRows.length) {
        log.warn('No hay datos de aspirantes para importar');
        return 0;
    }
    
    let imported = 0;
    let errors = 0;
    
    for (const row of dataRows) {
        try {
            const iduAspirante = cleanCell(row[0]);
            
            if (!iduAspirante || !iduAspirante.startsWith('RA')) continue;
            
            const values = [
                iduAspirante,
                cleanCell(row[2]),  // idu_requisicion
                parseNumber(row[7]),  // numero_cedula
                cleanCell(row[9]),  // primer_nombre
                cleanCell(row[10]),  // segundo_nombre
                cleanCell(row[12]),  // primer_apellido
                cleanCell(row[11]),  // segundo_apellido
                cleanCell(row[8]),  // email
                cleanCell(row[13]),  // telefono
                cleanCell(row[14]),  // genero
                parseDate(row[15]),  // fecha_nacimiento
                cleanCell(row[16]),  // cargo_aspirante
                cleanCell(row[17]),  // area_proyecto
                parseNumber(row[18]) || 0,  // experiencia_anos
                cleanCell(row[42]),  // experiencia_requerida_rangos
                cleanCell(row[19]),  // fuente_reclutamiento
                parseNumber(row[41]) || 0,  // evaluacion_puntaje
                parseNumber(row[59]) || 0,  // competencia_requerida
                cleanCell(row[37]),  // competencia_sensibilidad
                cleanCell(row[38]),  // competencia_enfoque
                cleanCell(row[39]),  // competencia_orientación
                parseNumber(row[41]) || 0,  // resultado_evaluacion
                parseNumber(row[42]) || 0,  // experiencia_score
                parseNumber(row[40]) || 0,  // academico_score
                cleanCell(row[61]) || 'Pendiente',  // decision_seleccion
                cleanCell(row[60]),  // concepto_final
                cleanCell(row[20]),  // hoja_vida_pdf
                null,  // hoja_vida_filename
                cleanCell(row[62]),  // entrevistador_nombre
                cleanCell(row[63]),  // entrevistador_cedula
                cleanCell(row[64]),  // documento_sarlaft
                cleanCell(row[29]) === 'No' ? 0 : 1,  // tiene_moto_vehiculo
                cleanCell(row[30]) === 'No' ? 0 : 1,  // documentos_al_dia
                cleanCell(row[31]) === 'No' ? 0 : 1,  // licencia_vigente
                cleanCell(row[32]) === 'No' ? 0 : 1,  // soat_vigente
                cleanCell(row[33]) === 'No' ? 0 : 1,  // tecnicomecanica_vigente
                cleanCell(row[35]) === 'No' ? 0 : 1,  // aprobacion_revision_vial
                cleanCell(row[22] || 'No'),  // ¿Has trabajado en Discol?
                cleanCell(row[23] || 'No'),  // ¿Tienes familiares?
                cleanCell(row[24] || 'No'),  // ¿Laborado empresas vinculadas?
                parseDate(row[1])  // fecha_solicitud
            ];
            
            const sql = `
                INSERT IGNORE INTO erp_aspirantes (
                    idu_aspirante, idu_requisicion, numero_cedula,
                    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                    email, telefono, genero, fecha_nacimiento,
                    cargo_aspirante, area_proyecto, experiencia_anos,
                    experiencia_requerida_rangos, fuente_reclutamiento,
                    evaluacion_puntaje, competencia_requerida,
                    competencia_sensibilidad, competencia_enfoque, competencia_orientacion,
                    resultado_evaluacion, experiencia_score, academico_score,
                    decision_seleccion, concepto_final, hoja_vida_pdf, hoja_vida_filename,
                    entrevistador_nombre, entrevistador_cedula, documento_sarlaft,
                    tiene_moto_vehiculo, documentos_al_dia, licencia_vigente,
                    soat_vigente, tecnicomecanica_vigente, aprobacion_revision_vial,
                    trabajo_previo_discol, tiene_familiares_discol, labora_empresas_vinculadas,
                    fecha_solicitud
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(sql, values);
            imported++;
            
        } catch (err) {
            errors++;
            log.warn(`Error en aspirante: ${err.message}`);
        }
    }
    
    log.count('ASPIRANTES', imported);
    if (errors > 0) log.warn(`${errors} errores encontrados`);
    return imported;
}

// =====================================================
// 4. IMPORTAR CONTRATACIONES
// =====================================================

async function importContrataciones(connection, workbook) {
    log.info('Importando CONTRATACIONES...');
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    const headerRow = data[1];
    const dataRows = data.slice(2);
    
    if (!dataRows.length) {
        log.warn('No hay datos de contrataciones para importar');
        return 0;
    }
    
    let imported = 0;
    let errors = 0;
    
    for (const row of dataRows) {
        try {
            const iduContrato = cleanCell(row[0]);
            
            if (!iduContrato || !iduContrato.startsWith('RC')) continue;
            
            const values = [
                iduContrato,
                cleanCell(row[2]),  // idu_aspirante
                parseNumber(row[4]),  // numero_cedula
                cleanCell(row[5]),  // primer_nombre
                cleanCell(row[6]),  // segundo_nombre
                cleanCell(row[7]),  // primer_apellido
                cleanCell(row[8]),  // segundo_apellido
                cleanCell(row[9]),  // cargo
                cleanCell(row[3]),  // proyecto_asignado
                cleanCell(row[10]),  // ciudad_municipio
                cleanCell(row[11]),  // examenes_medicos_pdf
                'Pendiente',
                cleanCell(row[12]),  // cedula_pdf
                'Pendiente',
                null,  // hoja_vida_pdf
                'Pendiente',
                cleanCell(row[17]),  // policia_antecedentes_pdf
                'Pendiente',
                null,  // certificacion_bancaria_pdf
                'Pendiente',
                cleanCell(row[19]),  // licencia_conducir_pdf
                'Pendiente',
                null,  // medidas_correctivas_pdf
                'No aplica',
                null,  // sarlaft_pdf
                'Pendiente',
                null,  // aptitud_laboral_pdf
                'Pendiente',
                cleanCell(row[23]) || 'Regular',  // tipo_proceso
                cleanCell(row[24]),  // evidencia_texto
                'En proceso',
                cleanCell(row[25])  // creado_por
            ];
            
            const sql = `
                INSERT IGNORE INTO erp_contrataciones (
                    idu_contrato, idu_aspirante, numero_cedula,
                    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                    cargo, proyecto_asignado, ciudad_municipio,
                    examenes_medicos_pdf, examenes_medicos_estado,
                    cedula_pdf, cedula_estado,
                    hoja_vida_pdf, hoja_vida_estado,
                    policia_antecedentes_pdf, policia_estado,
                    certificacion_bancaria_pdf, certificacion_estado,
                    licencia_conducir_pdf, licencia_estado,
                    medidas_correctivas_pdf, medidas_estado,
                    sarlaft_pdf, sarlaft_estado,
                    aptitud_laboral_pdf, aptitud_estado,
                    tipo_proceso, evidencia_texto,
                    estado_vinculacion, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(sql, values);
            imported++;
            
        } catch (err) {
            errors++;
            log.warn(`Error en contratación: ${err.message}`);
        }
    }
    
    log.count('CONTRATACIONES', imported);
    if (errors > 0) log.warn(`${errors} errores encontrados`);
    return imported;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
    log.info('===== ERP DATA IMPORT INICIADO =====');
    log.info(`Path: ${path.join(__dirname, '../..', 'Downloads')}`);
    
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        log.success('Conexión a BD establecida');
        
        const excelDir = path.join(__dirname, '../..', 'Downloads');
        
        let totalImported = 0;
        
        // Import each file
        for (const [type, filename] of Object.entries(EXCEL_FILES)) {
            const filepath = path.join(excelDir, filename);
            
            if (!fs.existsSync(filepath)) {
                log.error(`Archivo no encontrado: ${filepath}`);
                continue;
            }
            
            log.info(`Leyendo: ${filename}`);
            const workbook = XLSX.readFile(filepath);
            
            let count = 0;
            switch (type) {
                case 'candidatos':
                    count = await importCandidatos(connection, workbook);
                    break;
                case 'requisiciones':
                    count = await importRequisiciones(connection, workbook);
                    break;
                case 'aspirantes':
                    count = await importAspirantes(connection, workbook);
                    break;
                case 'contrataciones':
                    count = await importContrataciones(connection, workbook);
                    break;
            }
            
            totalImported += count;
        }
        
        log.success(`\n===== IMPORTACIÓN COMPLETADA =====`);
        log.count('TOTAL DE REGISTROS IMPORTADOS', totalImported);
        
    } catch (err) {
        log.error(`Error fatal: ${err.message}`);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(err => {
        log.error(err.message);
        process.exit(1);
    });
}

module.exports = { importCandidatos, importRequisiciones, importAspirantes, importContrataciones };
