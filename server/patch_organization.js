const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function patchDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistema_gestion_talento'
        });

        console.log('Applying Organization Hierarchy patch...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Create new tables
        await connection.query(`CREATE TABLE IF NOT EXISTS proyectos (id INT PRIMARY KEY AUTO_INCREMENT, nombre VARCHAR(150) NOT NULL)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS centros_costo (id INT PRIMARY KEY AUTO_INCREMENT, nombre VARCHAR(150) NOT NULL)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS subcentros_costo (id INT PRIMARY KEY AUTO_INCREMENT, nombre VARCHAR(150) NOT NULL)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS tipos_trabajo (id INT PRIMARY KEY AUTO_INCREMENT, codigo VARCHAR(10), nombre VARCHAR(150))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS tipos_proyecto (id INT PRIMARY KEY AUTO_INCREMENT, codigo VARCHAR(10), nombre VARCHAR(150))`);

        // 2. Add columns to vacantes
        const columnsToAdd = [
            { name: 'proyecto_id', type: 'INT' },
            { name: 'centro_costo_id', type: 'INT' },
            { name: 'subcentro_id', type: 'INT' },
            { name: 'tipo_trabajo_id', type: 'INT' },
            { name: 'tipo_proyecto_id', type: 'INT' }
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE vacantes ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added vacantes.${col.name}`);
            } catch (e) {
                console.log(`Notice: vacantes.${col.name} already exists or error: ${e.message}`);
            }
        }

        // 3. Clear and Seed Sedes (Updating based on image)
        await connection.query(`DELETE FROM sedes`);
        const sedes = [
            ['B1', 'Barranquilla'], ['C1', 'Cartagena'], ['C2', 'Ciénaga'],
            ['M1', 'Montería'], ['P1', 'Palmira'], ['S1', 'Sincelejo'],
            ['S2', 'Santa Marta'], ['V1', 'Valledupar']
        ];
        for (const [code, name] of sedes) {
            await connection.query(`INSERT INTO sedes (nombre) VALUES (?)`, [`${code} - ${name}`]);
        }

        // 4. Seed Proyectos
        await connection.query(`DELETE FROM proyectos`);
        const proyectos = [
            'AGUAS DE CARTAGENA', 'GASES DEL CARIBE', 'MEXICHEM',
            'OPERADORES DE LA SIERRA', 'SURTIGAS', 'ADMINISTRATIVOS',
            'AGUAS DEL SUR DEL ATLANTICO'
        ];
        for (const name of proyectos) {
            await connection.query(`INSERT INTO proyectos (nombre) VALUES (?)`, [name]);
        }

        // 5. Seed Tipos Trabajo
        await connection.query(`DELETE FROM tipos_trabajo`);
        const tiposTrabajo = [
            ['T01', 'Cartera Contención'], ['T02', 'Cartera Normalización'],
            ['T03', 'Cartera Castigada'], ['T04', 'Cartera Fija'],
            ['T05', 'CM'], ['T06', 'Acometida']
        ];
        for (const [code, name] of tiposTrabajo) {
            await connection.query(`INSERT INTO tipos_trabajo (codigo, nombre) VALUES (?, ?)`, [code, name]);
        }

        // 6. Seed Tipos Proyecto
        await connection.query(`DELETE FROM tipos_proyecto`);
        const tiposProyecto = [
            ['P01', 'SCR'], ['P02', 'Cartera'], ['P03', 'In House'],
            ['P04', 'Civil'], ['P05', 'Venta'], ['P06', 'Auditoria'], ['P07', 'Admon']
        ];
        for (const [code, name] of tiposProyecto) {
            await connection.query(`INSERT INTO tipos_proyecto (codigo, nombre) VALUES (?, ?)`, [code, name]);
        }

        // 7. Seed Centros de Costo
        await connection.query(`DELETE FROM centros_costo`);
        const centrosCosto = [
            'SCR Aguas de Cartagena', 'SCR Gases del Caribe', 'SCR Gases de Occidente',
            'Cartera Surtigas', 'Cartera Gases del Caribe', 'Cartera Operadores Sierra',
            'Admon', 'Mexichem', 'Control Ambiental / Mantenimiento',
            'Interventoria Surtigas', 'Valvula Fracort', 'SCR Surtigas',
            'AGUAS DE CARTAGENA', 'SCR AQSUR'
        ];
        for (const name of centrosCosto) {
            await connection.query(`INSERT INTO centros_costo (nombre) VALUES (?)`, [name]);
        }

        // 8. Seed Subcentros de Costo
        await connection.query(`DELETE FROM subcentros_costo`);
        const subcentros = [
            'A.G DIRECCION ADMINISTRATIVA Y FINANCIERA', 'A.G GESTION HUMANA',
            'A.G NOMINA', 'A.G TESORERIA', 'A.G CONTABILIDAD', 'A.G LOGISTICA',
            'A.G HSEQ', 'A.G SISTEMA', 'A.G SERVICIOS GENERALES', 'A.G.DISCOL',
            'SCR03 GDO PALMIRA', 'A.G PQRS', 'A.G CONTROL', 'PG GERENCIA PROYECTOS',
            'PG DIRECCION DE PROYECTOS', 'PG CONTAC CENTER', 'PG OTROS COSTOS GENERALES',
            'OS01 SURTIGAS INTERVENTORIA', 'OS VALVULAS FRACORT', 'A.G ADQUISICION',
            'A.G CALIDAD', 'GC07 ATLANTICO', 'A.G GESTION DEL CAMBIO',
            'SCR06 SURTIGAS CM CARTAGENA', 'SCR06 ACOM CARTAGENA',
            'SCR06 SURTIGAS CM MONTERIA', 'SCR06 SURTIGAS ACOM MONTERIA',
            'SCR06 SURTIGAS CM SINCELEJO', 'SCR06 ACOM SINCELEJO',
            'SCR09 OPERADORES CIENAGA', 'GC08 SURTIGAS AGENCIA SUCRE',
            'GC08 SURTIGAS AGENCIA CORDOBA', 'GC07 CESAR', 'OC07 ACUACAR MANTENIMIENTO',
            'GC07 MAGDALENA', 'SCR02 ATL ACOM', 'SCR02 ATL MED', 'SCR02 CESAR',
            'OC08 NUEVAS ACOMETIDAS', 'SCR07 AQSUR ATLANTICO', 'SCR08 GDO CAUCA',
            'GC09 SURTIGAS AGENCIAS MENORES BOLIVAR', 'GC09 SURTIGAS CARTAGENA',
            'GC09 SURTIGAS MONTERIA', 'GC09 SURTIGAS SUCRE-SUR BOLIVAR'
        ];
        for (const name of subcentros) {
            await connection.query(`INSERT INTO subcentros_costo (nombre) VALUES (?)`, [name]);
        }

        console.log('Organization patch completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error patching database:', error);
    }
}

patchDatabase();
