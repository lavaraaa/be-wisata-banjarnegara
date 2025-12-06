const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection(process.env.DB_URL);

connection.connect((err) => {
  if (err) {
    console.error('Koneksi database gagal:', err);
    return;
  }
  console.log('Terhubung ke database MySQL!');
});

module.exports = connection;
