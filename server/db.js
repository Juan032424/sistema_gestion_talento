const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Use __dirname to always find .env relative to this file's location
// This works regardless of where PM2 starts the process
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

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

module.exports = pool;
