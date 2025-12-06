const mysql = require('mysql2');

const connection = mysql.createConnection({
  uri: process.env.DB_URL,
  ssl: { rejectUnauthorized: false } // sementara untuk tes
});

connection.connect((err) => {
  if (err) {
    console.error('Koneksi database gagal:', err);
    return;
  }
  console.log('Terhubung ke database MySQL!');
});

module.exports = connection;
