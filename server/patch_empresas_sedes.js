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

        console.log('Applying empresas and sedes update patch...');

        // 1. Create empresas table
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS empresas (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    nombre VARCHAR(150) NOT NULL,
                    nit VARCHAR(50),
                    sector VARCHAR(100),
                    caracteristicas JSON
                )
            `);
            console.log('Created table empresas');
        } catch (e) {
            console.error('Error creating empresas table:', e);
        }

        // 2. Update sedes table
        try {
            await connection.query(`ALTER TABLE sedes ADD COLUMN empresa_id INT`);
            console.log('Added sedes.empresa_id');
        } catch (e) { console.log('Notice: sedes.empresa_id already exists'); }

        try {
            await connection.query(`ALTER TABLE sedes ADD COLUMN direccion VARCHAR(255)`);
            console.log('Added sedes.direccion');
        } catch (e) { console.log('Notice: sedes.direccion already exists'); }

        try {
            await connection.query(`ALTER TABLE sedes ADD COLUMN contacto VARCHAR(100)`);
            console.log('Added sedes.contacto');
        } catch (e) { console.log('Notice: sedes.contacto already exists'); }

        // 3. Add foreign key if possible
        try {
            await connection.query(`ALTER TABLE sedes ADD FOREIGN KEY (empresa_id) REFERENCES empresas(id)`);
            console.log('Added foreign key from sedes to empresas');
        } catch (e) { console.log('Notice: foreign key already exists or failed to add'); }

        // 4. Seed a default company and link existing sedes
        try {
            const [empresas] = await connection.query('SELECT * FROM empresas WHERE nombre = "Empresa Principal"');
            let empresaId;
            if (empresas.length === 0) {
                const [result] = await connection.query('INSERT INTO empresas (nombre) VALUES ("Empresa Principal")');
                empresaId = result.insertId;
                console.log('Created default company "Empresa Principal"');
            } else {
                empresaId = empresas[0].id;
            }

            // Update sedes that don't have an empresa_id
            await connection.query('UPDATE sedes SET empresa_id = ? WHERE empresa_id IS NULL', [empresaId]);
            console.log('Linked orphan sedes to "Empresa Principal"');
        } catch (e) {
            console.error('Error seeding default company:', e);
        }

        console.log('Database patch completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error patching database:', error);
    }
}

patchDatabase();
