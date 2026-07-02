const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Script para previsualizar candidatos del ERP antes de importarlos
 * Permite ver qué datos se van a importar y seleccionar cuáles
 */

let candidatos = [];
let requisiciones = [];
let aspirantes = [];
let contrataciones = [];

// Rutas de los archivos Excel
const EXCEL_PATHS = {
    candidatos: path.join(process.env.USERPROFILE, 'Downloads', 'Lista de Hoja de Vida (1).xlsx'),
    requisiciones: path.join(process.env.USERPROFILE, 'Downloads', 'Listado de Requisiciones de Personal.xlsx'),
    aspirantes: path.join(process.env.USERPROFILE, 'Downloads', 'Lista de Registros de Apirantes.xlsx'),
    contrataciones: path.join(process.env.USERPROFILE, 'Downloads', 'Lista de Registros de Contratacion.xlsx')
};

/**
 * Lee archivo Excel y extrae datos
 */
function leerExcel(filePath, nombreHoja = 0) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ No encontrado: ${filePath}`);
            return [];
        }
        
        const workbook = XLSX.readFile(filePath, { defval: '' });
        const sheetName = workbook.SheetNames[nombreHoja];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Saltar primera fila (títulos generales) y usar segunda fila como headers
        if (data.length > 1) {
            const headers = data[1];
            const filas = data.slice(2); // Datos desde fila 3
            
            return filas.map(fila => {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = fila[index] || null;
                });
                return obj;
            }).filter(obj => Object.values(obj).some(v => v)); // Filtrar filas vacías
        }
        
        return [];
    } catch (error) {
        console.error(`Error leyendo ${filePath}:`, error.message);
        return [];
    }
}

/**
 * Procesa candidatos
 */
function procesarCandidatos() {
    console.log('\n📋 LEYENDO CANDIDATOS...');
    const datos = leerExcel(EXCEL_PATHS.candidatos);
    
    candidatos = datos.map((row, idx) => ({
        numFila: idx + 3,
        identificacion: row['Número de Cedula'] || row['Cedula'] || '',
        tipoID: row['Tipo Identificación'] || 'Cedula',
        nombre: `${row['Nombres'] || ''} ${row['Apellidos'] || ''}`.trim(),
        nombres: row['Nombres'] || '',
        apellidos: row['Apellidos'] || '',
        email: row['Correo Electrónico'] || row['Email'] || '',
        telefono: row['Teléfono'] || row['Celular'] || '',
        departamento: row['Departamento'] || '',
        ciudad: row['Ciudad'] || row['Municipio'] || '',
        fecha_nacimiento: row['Fecha de Nacimiento'] || '',
        nivel_academico: row['Nivel Académico'] || '',
        estado_civil: row['Estado Civil'] || '',
        genero: row['Género'] || '',
        tiene_hijos: row['Tiene Hijos'] === 'Sí' || row['Tiene Hijos'] === 'Si',
        cantidad_hijos: parseInt(row['Cantidad de Hijos']) || 0,
        direccion: row['Dirección'] || row['Domicilio'] || '',
        documentos: {
            hoja_vida_pdf: row['Hoja de Vida PDF'] || row['CV PDF'] || null,
            cedula_pdf: row['Cédula PDF'] || row['ID PDF'] || null
        }
    })).filter(c => c.identificacion); // Solo los que tienen cédula
    
    console.log(`✅ Se encontraron ${candidatos.length} candidatos`);
    return candidatos;
}

/**
 * Procesa requisiciones
 */
function procesarRequisiciones() {
    console.log('\n📋 LEYENDO REQUISICIONES...');
    const datos = leerExcel(EXCEL_PATHS.requisiciones);
    
    requisiciones = datos.map((row, idx) => ({
        numFila: idx + 3,
        idu_requisicion: row['IDU'] || row['Requisición #'] || row['ID'] || '',
        puesto_solicitado: row['Puesto'] || row['Cargo'] || '',
        nombre_solicitante: row['Solicitante'] || '',
        cedula_solicitante: row['Cedula Solicitante'] || '',
        numero_vacantes: parseInt(row['Vacantes']) || parseInt(row['# Vacantes']) || 1,
        departamento: row['Área'] || row['Departamento'] || '',
        jornada_laboral: row['Jornada'] || row['Tipo Jornada'] || '',
        nivel_educativo: row['Nivel Educativo'] || '',
        experiencia: row['Experiencia'] || row['Años Experiencia'] || '',
        estado: row['Estado'] || row['Status'] || 'Pendiente',
        fecha_creacion: row['Fecha'] || new Date().toISOString().split('T')[0],
        salario_oferta: row['Salario'] || row['Salario Oferta'] || '',
        observaciones: row['Observaciones'] || ''
    })).filter(r => r.idu_requisicion);
    
    console.log(`✅ Se encontraron ${requisiciones.length} requisiciones`);
    return requisiciones;
}

/**
 * Procesa aspirantes
 */
function procesarAspirantes() {
    console.log('\n📋 LEYENDO ASPIRANTES...');
    const datos = leerExcel(EXCEL_PATHS.aspirantes);
    
    aspirantes = datos.map((row, idx) => ({
        numFila: idx + 3,
        idu_aspirante: row['RA#'] || row['ID Aspirante'] || row['RA'] || '',
        idu_requisicion: row['Requisición#'] || row['RP'] || '',
        numero_cedula: row['Número de Cedula'] || row['Cedula'] || '',
        nombres: row['Nombres'] || row['Nombre'] || '',
        apellidos: row['Apellidos'] || '',
        email: row['Correo'] || row['Email'] || '',
        telefono: row['Teléfono'] || row['Celular'] || '',
        puntaje_pruebas: parseFloat(row['Puntaje']) || parseFloat(row['Calificación']) || 0,
        decision: row['Decisión'] || row['Status'] || 'Pendiente',
        fecha_aplicacion: row['Fecha Aplicación'] || new Date().toISOString().split('T')[0],
        entrevistador: row['Entrevistador'] || '',
        observaciones: row['Observaciones'] || row['Notas'] || ''
    })).filter(a => a.numero_cedula && a.idu_requisicion);
    
    console.log(`✅ Se encontraron ${aspirantes.length} aspirantes`);
    return aspirantes;
}

/**
 * Procesa contrataciones
 */
function procesarContrataciones() {
    console.log('\n📋 LEYENDO CONTRATACIONES...');
    const datos = leerExcel(EXCEL_PATHS.contrataciones);
    
    contrataciones = datos.map((row, idx) => ({
        numFila: idx + 3,
        idu_contrato: row['RC#'] || row['ID Contrato'] || row['RC'] || '',
        idu_aspirante: row['RA#'] || row['Aspirante'] || '',
        idu_requisicion: row['RP#'] || row['Requisición'] || '',
        numero_cedula: row['Número de Cedula'] || row['Cedula'] || '',
        nombre_completo: `${row['Nombres'] || ''} ${row['Apellidos'] || ''}`.trim(),
        email: row['Email'] || row['Correo'] || '',
        puesto_contratado: row['Puesto'] || '',
        fecha_contrato: row['Fecha Contrato'] || row['Fecha'] || '',
        salario_final: row['Salario'] || '',
        estado_contrato: row['Estado'] || 'Activo',
        documentos: {
            cedula_pdf: row['Cédula PDF'] || null,
            diploma_pdf: row['Diploma PDF'] || null,
            emopat_pdf: row['EMOPAT PDF'] || null,
            referencia_laboral: row['Referencia Laboral'] || null,
            antecedentes_pdf: row['Antecedentes PDF'] || null
        },
        fecha_inicio: row['Fecha Inicio'] || ''
    })).filter(c => c.numero_cedula || c.idu_contrato);
    
    console.log(`✅ Se encontraron ${contrataciones.length} contrataciones`);
    return contrataciones;
}

/**
 * Muestra un resumen visual
 */
function mostrarResumen() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE DATOS EN EXCEL');
    console.log('='.repeat(80));
    
    console.log(`\n📄 CANDIDATOS: ${candidatos.length}`);
    candidatos.slice(0, 3).forEach(c => {
        console.log(`   ├─ ${c.identificacion} | ${c.nombre} | ${c.email}`);
    });
    if (candidatos.length > 3) console.log(`   └─ ... y ${candidatos.length - 3} más`);
    
    console.log(`\n📋 REQUISICIONES: ${requisiciones.length}`);
    requisiciones.slice(0, 3).forEach(r => {
        console.log(`   ├─ ${r.idu_requisicion} | ${r.puesto_solicitado} | ${r.numero_vacantes} vacante(s)`);
    });
    if (requisiciones.length > 3) console.log(`   └─ ... y ${requisiciones.length - 3} más`);
    
    console.log(`\n👤 ASPIRANTES: ${aspirantes.length}`);
    aspirantes.slice(0, 3).forEach(a => {
        console.log(`   ├─ ${a.idu_aspirante} | ${a.nombres} ${a.apellidos} | ${a.idu_requisicion}`);
    });
    if (aspirantes.length > 3) console.log(`   └─ ... y ${aspirantes.length - 3} más`);
    
    console.log(`\n✅ CONTRATADOS: ${contrataciones.length}`);
    contrataciones.slice(0, 3).forEach(c => {
        console.log(`   ├─ ${c.idu_contrato} | ${c.nombre_completo} | ${c.puesto_contratado}`);
    });
    if (contrataciones.length > 3) console.log(`   └─ ... y ${contrataciones.length - 3} más`);
    
    console.log('\n' + '='.repeat(80));
}

/**
 * Exporta datos para usarlos en API
 */
function exportarJSON() {
    const salida = {
        timestamp: new Date().toISOString(),
        resumen: {
            candidatos: candidatos.length,
            requisiciones: requisiciones.length,
            aspirantes: aspirantes.length,
            contrataciones: contrataciones.length
        },
        datos: {
            candidatos,
            requisiciones,
            aspirantes,
            contrataciones
        }
    };
    
    const rutaSalida = path.join(__dirname, 'preview_erp_data.json');
    fs.writeFileSync(rutaSalida, JSON.stringify(salida, null, 2), 'utf-8');
    console.log(`\n💾 Datos guardados en: ${rutaSalida}`);
    
    return salida;
}

/**
 * Ejecuta todo
 */
async function main() {
    console.log('\n🚀 IMPORTADOR ERP - VISTA PREVIA');
    console.log('================================\n');
    
    try {
        procesarCandidatos();
        procesarRequisiciones();
        procesarAspirantes();
        procesarContrataciones();
        
        mostrarResumen();
        exportarJSON();
        
        console.log('\n✅ Vista previa completada. Datos listos para importar.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    main();
}

// Exportar para usar como módulo
module.exports = {
    candidatos: () => candidatos,
    requisiciones: () => requisiciones,
    aspirantes: () => aspirantes,
    contrataciones: () => contrataciones,
    procesarCandidatos,
    procesarRequisiciones,
    procesarAspirantes,
    procesarContrataciones
};
