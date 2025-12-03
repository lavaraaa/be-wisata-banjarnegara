const db = require('../db');

// Ambil hanya user dengan role 'user'
exports.getAllUsers = (req, res) => {
  const sql = 'SELECT id, username, email, photoURL FROM users WHERE role = "user"';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Query error:', err);
      return res.status(500).json({ message: 'Gagal mengambil data user' });
    }

    console.log('✅ Data user dengan role user:', results);
    res.status(200).json(results);
  });
};

// DELETE User berdasarkan ID
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) {
      console.error('❌ Gagal menghapus user:', err);
      return res.status(500).json({ message: 'Gagal menghapus user' });
    }
    res.json({ message: 'User berhasil dihapus' });
  });
};

exports.getUserById = (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT id, username, email, photoURL FROM users WHERE id = ? AND role = "user"';

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('❌ Gagal ambil user:', err);
      return res.status(500).json({ message: 'Gagal ambil user' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.status(200).json(result[0]);
  });
};