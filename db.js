const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  uri: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl-mode=VERIFY_CA`
});

connection.connect((err) => {
  if (err) {
    console.error('Koneksi database gagal:', err);
    return;
  }
  console.log('Terhubung ke database MySQL!');
});

module.exports = connection;
