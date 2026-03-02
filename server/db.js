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
  maxIdle: 0, // IMPORTANT: Don't keep any idle connections to prevent proxy disconnects
  idleTimeout: 30000,
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

// Manual Heartbeat: Keep the connection proxy alive every 15 seconds
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('💓 Database Heartbeat: Ping OK');
  } catch (err) {
    console.error('💔 Database Heartbeat: FAILED', err.message);
  }
}, 15000);

module.exports = pool;
