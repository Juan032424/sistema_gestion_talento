const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
    try {
        // Create connection without database selected to create it if needed
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon to get individual statements (rough implementation)
        const statements = schemaSql.split(';').filter(stmt => stmt.trim());

        console.log('Initializing database...');

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        console.log('Database setup completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase();
