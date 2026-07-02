const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// Las rutas de los archivos
const files = [
  { path: 'c:\\Users\\analistasistema\\Downloads\\Listado de Requisiciones de Personal.xlsx', table: 'erp_requisiciones_personal' },
  { path: 'c:\\Users\\analistasistema\\Downloads\\Lista de Registros de Contratacion.xlsx', table: 'erp_registros_contratacion' },
  { path: 'c:\\Users\\analistasistema\\Downloads\\Lista de Registros de Apirantes.xlsx', table: 'erp_registros_aspirantes' },
  { path: 'c:\\Users\\analistasistema\\Downloads\\Lista de Hoja de Vida (1).xlsx', table: 'erp_hojas_vida' }
];

function sanitizeColumnName(header) {
    if (!header) return 'columna_desconocida';
    // Remove "— Filtrar por X —" and everything after it usually
    let str = header.toString();
    if (str.includes('— Filtrar por')) {
        str = str.split('— Filtrar por')[0];
    }
    
    // Reemplaza no-alfanuméricos con guiones bajos, quita espacios extra, a minúsculas, recorta a 64 chars
    let cleaned = str.trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
    
    // Quitar guión bajo al final si lo hay
    if (cleaned.endsWith('_')) cleaned = cleaned.slice(0, -1);
    
    if (!cleaned) return 'columna_desconocida';
    if (!isNaN(cleaned.charAt(0))) cleaned = 'c_' + cleaned;
    
    return cleaned.substring(0, 60);
}

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sistema_gestion_talento',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    });

    try {
        console.log("Conectado a la base de datos.");

        for (const file of files) {
            console.log(`\nProcesando archivo: ${file.path}`);
            const workbook = xlsx.readFile(file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Obtener todas las filas
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            if (data.length === 0) {
                console.log('Archivo vacío');
                continue;
            }

            // Encontrar la fila que tenga más columnas (probablemente son los headers reales)
            let maxCols = 0;
            let headerRowIndex = 0;
            
            for (let i = 0; i < Math.min(10, data.length); i++) {
                if (data[i] && data[i].length > maxCols) {
                    maxCols = data[i].length;
                    headerRowIndex = i;
                }
            }
            
            const rawHeaders = data[headerRowIndex];
            const columnNames = [];
            const colMap = new Set();
            
            // Sanitizar y deducir headers únicos
            let colIndex = 0;
            for (let h of rawHeaders) {
                let name = sanitizeColumnName(h);
                if (name === 'columna_desconocida' || name === '') {
                    name = `columna_${colIndex}`;
                }
                if (name === 'id') {
                    name = 'id_erp';
                }
                
                let counter = 1;
                let finalName = name;
                while (colMap.has(finalName)) {
                    finalName = `${name}_${counter}`;
                    counter++;
                }
                colMap.add(finalName);
                columnNames.push(finalName);
                colIndex++;
            }

            // Generar SQL CREATE TABLE
            let sqlDrop = `DROP TABLE IF EXISTS ${file.table};`;
            await pool.query(sqlDrop); // Drop previous bad table

            let sql = `CREATE TABLE ${file.table} (\n`;
            sql += `    id INT AUTO_INCREMENT PRIMARY KEY,\n`;
            
            const colDefs = columnNames.map(col => `    \`${col}\` TEXT`);
            sql += colDefs.join(',\n');
            sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

            console.log(`Columnas detectadas: ${columnNames.length}`);
            // console.log("Ejemplo: ", columnNames.slice(0, 5));
            console.log(`Ejecutando creación de tabla: ${file.table}...`);
            await pool.query(sql);
            console.log(`Tabla ${file.table} creada con éxito con ${columnNames.length} columnas.`);
        }
        console.log("\n✅ Todas las tablas ERP creadas correctamente en la BD.");
        process.exit(0);
    } catch (err) {
        console.error("Error fatal:", err);
        process.exit(1);
    }
}

run();
