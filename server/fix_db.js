const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

async function checkAndApply() {
    let conn;
    try {
        console.log('--- DB Check ---');
        console.log('Host:', process.env.DB_HOST || 'localhost');
        console.log('User:', process.env.DB_USER);
        console.log('DB:', process.env.DB_NAME);
        
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin',
            database: process.env.DB_NAME || 'sistema_gestion_talento',
            connectTimeout: 5000
        });

        console.log('Connected to DB.');
        
        // Use more standard SQL to check if column exists
        const [rows] = await conn.query("SHOW COLUMNS FROM users LIKE 'avatar_url'");
        if (rows.length === 0) {
            console.log("Column 'avatar_url' missing. Adding...");
            await conn.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL");
            console.log("Column added successfully.");
        } else {
            console.log("Column 'avatar_url' already exists.");
        }
        
    } catch (err) {
        console.error('CRITICAL DB ERROR:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        if (conn) await conn.end();
        console.log('--- Done ---');
        process.exit();
    }
}

checkAndApply();
