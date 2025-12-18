const db = require('../db');

// Ambil hanya user dengan role 'user'
exports.getAllUsers = async (req, res) => {
  try {
    const sql = "SELECT id, username, email, photoURL FROM users WHERE role = 'user'";
    const [results] = await db.query(sql);

    console.log('✅ Data user dengan role user:', results);
    res.status(200).json(results);
  } catch (err) {
    console.error('❌ Query error:', err);
    res.status(500).json({ message: 'Gagal mengambil data user', error: err.message });
  }
};

// DELETE User berdasarkan ID
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('❌ Gagal menghapus user:', err);
    res.status(500).json({ message: 'Gagal menghapus user', error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
      const query = "SELECT id, username, email, photoURL FROM users WHERE id = ? AND role = 'user'";
    const [result] = await db.query(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.status(200).json(result[0]);
  } catch (err) {
    console.error('❌ Gagal ambil user:', err);
    res.status(500).json({ message: 'Gagal ambil user', error: err.message });
  }
};