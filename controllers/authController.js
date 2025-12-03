require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Kesalahan server.' });
    if (result.length > 0) {
      return res.status(409).json({ message: 'Username atau email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user'],
      (err) => {
        if (err) return res.status(500).json({ message: 'Gagal mendaftar user.' });
        res.status(201).json({ message: 'Registrasi berhasil!' });
      }
    );
  });
};

// LOGIN
exports.login = (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/Username dan password wajib diisi.' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ? OR  BINARY username = ?',
    [identifier, identifier],
    async (err, result) => {
      if (err) return res.status(500).json({ message: 'Kesalahan server.' });
      if (result.length === 0) {
        return res.status(401).json({ message: 'User tidak ditemukan.' });
      }

      const user = result[0];

      // Log data yang diterima
      console.log('User ditemukan:', user);

      // Log password yang dimasukkan dan password yang dihash
      console.log('Password yang dimasukkan:', password);
      console.log('Password yang disimpan:', user.password);

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Password salah.' });
      }

      // Membuat JWT Token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET, 
        { expiresIn: '10y' }
      );
      res.json({
        message: 'Login berhasil.',
        token,
        role: user.role,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          photoURL: user.photoURL,
           role: user.role,
        }
      });
    }
  );
};

// GET /api/users
exports.getUsers = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];  // Ambil token dari header Authorization

  if (!token) {
    console.log('Token tidak ditemukan'); // Log jika token tidak ada
    return res.status(403).json({ message: 'Token tidak ditemukan.' });
  }

  console.log('Token diterima:', token);  // Log token yang diterima

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error JWT verify:', err);  // Log error jika token tidak valid
      return res.status(403).json({ message: 'Token tidak valid.' });
    }

    console.log('Decoded JWT:', decoded);  // Log hasil decode token untuk memastikan token terdekripsi dengan benar

    const { role } = decoded;

    // Jika bukan admin, hanya user terkait yang bisa mengambil data
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Ambil daftar user
    db.query('SELECT id, username, email, photoURL, role FROM users', (err, result) => {
      if (err) return res.status(500).json({ message: 'Kesalahan server.' });

      res.status(200).json({ data: result });
    });
  });
};

exports.getCurrentUser = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid.' });
    }

    const userId = decoded.id;

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
      if (err || result.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan.' });
      }

      res.json(result[0]); // Kirim semua data user
    });
  });
};
