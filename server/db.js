const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_gestion_talento',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // Maintain up to 10 idle connections
  idleTimeout: 60000, // Close idle connections after 60 seconds explicitly to prevent proxy drops
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Global Pool Error Logger to prevent server crashes
pool.on('error', (err) => {
  console.error('⚠️ [DB Pool] Global Error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('⚠️ [DB Pool] Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('⚠️ [DB Pool] Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('⚠️ [DB Pool] Database connection was refused.');
  }
});

module.exports = pool;
