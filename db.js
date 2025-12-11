const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false   // WAJIB: Aiven + Vercel
  },
  waitForConnections: true,
  connectionLimit: 10,        // Max 10 koneksi concurrent
  queueLimit: 0,              // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database pool connected to MySQL Aiven!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database pool connection failed:', err);
  });

module.exports = pool;
