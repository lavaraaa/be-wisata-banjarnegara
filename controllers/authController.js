require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    // Check if user exists
    const [result] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (result.length > 0) {
      return res.status(409).json({ message: 'Username atau email sudah terdaftar.' });
    }

    // Hash password and insert
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    res.status(201).json({ message: 'Registrasi berhasil!' });
  } catch (err) {
    console.error('Error register:', err);
    res.status(500).json({ message: 'Kesalahan server.', error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Username dan password wajib diisi.' });
    }

    const [result] = await db.query(
      'SELECT * FROM users WHERE email = ? OR BINARY username = ?',
      [identifier, identifier]
    );

    if (result.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan.' });
    }

    const user = result[0];

    // Log data yang diterima
    console.log('User ditemukan:', user);
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
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ message: 'Kesalahan server.', error: err.message });
  }
};

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      console.log('Token tidak ditemukan');
      return res.status(403).json({ message: 'Token tidak ditemukan.' });
    }

    console.log('Token diterima:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    const { role } = decoded;

    // Jika bukan admin, hanya user terkait yang bisa mengambil data
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Ambil daftar user
    const [result] = await db.query('SELECT id, username, email, photoURL, role FROM users');

    res.status(200).json({ data: result });
  } catch (err) {
    console.error('Error get users:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token tidak valid.' });
    }
    res.status(500).json({ message: 'Kesalahan server.', error: err.message });
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [result] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json(result[0]); // Kirim semua data user
  } catch (err) {
    console.error('Error get current user:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token tidak valid.' });
    }
    res.status(500).json({ message: 'Kesalahan server.', error: err.message });
  }
};
