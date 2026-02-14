const db = require('../db');
const jwt = require('jsonwebtoken');

// Tambah komentar
exports.komentarWisata = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata, isi, parent_id } = req.body;

    const query = "INSERT INTO komentar (user_id, wisata_id, isi, parent_id) VALUES (?, ?, ?, ?)";
    await db.query(query, [userId, id_wisata, isi, parent_id || null]);

    res.json({ success: true, message: "Komentar berhasil ditambahkan" });
  } catch (err) {
    console.error('Error tambah komentar:', err);
    res.status(500).json({ error: err.message });
  }
};

// Edit komentar (oleh pemilik)
exports.editKomentar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_komentar } = req.params;
    const { isi } = req.body;

    const cekQuery = "SELECT * FROM komentar WHERE id = ? AND user_id = ?";
    const [results] = await db.query(cekQuery, [id_komentar, userId]);

    if (results.length === 0) {
      return res.status(403).json({ error: "Tidak diizinkan mengedit komentar ini" });
    }

    const updateQuery = "UPDATE komentar SET isi = ? WHERE id = ?";
    await db.query(updateQuery, [isi, id_komentar]);

    res.json({ success: true, message: "Komentar berhasil diupdate" });
  } catch (err) {
    console.error('Error edit komentar:', err);
    res.status(500).json({ error: err.message });
  }
};

// Hapus komentar (oleh pemilik atau admin)
exports.hapusKomentar = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id_komentar } = req.params;

    const cekQuery = "SELECT * FROM komentar WHERE id = ?";
    const [results] = await db.query(cekQuery, [id_komentar]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    const komentar = results[0];

    if (komentar.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: "Tidak diizinkan menghapus komentar ini" });
    }

    const deleteQuery = "DELETE FROM komentar WHERE id = ?";
    await db.query(deleteQuery, [id_komentar]);

    res.json({ success: true, message: "Komentar berhasil dihapus" });
  } catch (err) {
    console.error('Error hapus komentar:', err);
    res.status(500).json({ error: err.message });
  }
};

// Ambil semua komentar berdasarkan id_wisata
exports.getKomentarByWisata = async (req, res) => {
  try {
    const idWisata = req.params.id_wisata;

    const sql = `
      SELECT k.id AS komentar_id, k.user_id, k.isi, k.created_at, k.parent_id,
             u.username, u.email, u.photoURL
      FROM komentar k
      JOIN users u ON k.user_id = u.id
      LEFT JOIN laporan_komentar lk ON k.id = lk.komentar_id
      WHERE k.wisata_id = ? AND lk.id IS NULL
      ORDER BY k.created_at DESC
    `;

    const [results] = await db.query(sql, [idWisata]);
    res.json(results);
  } catch (err) {
    console.error('Error get komentar by wisata:', err);
    res.status(500).json({ error: err.message });
  }
};

// Ambil semua komentar dengan data user dan wisata untuk admin
exports.getAllKomentarForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const sql = `
      SELECT
        k.id AS komentar_id, k.isi, k.created_at, k.user_id,
        u.username, u.email, u.photoURL,
        w.id AS id_wisata, w.judul AS judul_wisata
      FROM komentar k
      JOIN users u ON k.user_id = u.id
      JOIN wisata w ON k.wisata_id = w.id
      ORDER BY k.created_at DESC
    `;

    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error get all komentar for admin:', err);
    res.status(500).json({ error: err.message });
  }
};

// Hapus komentar oleh admin
exports.hapusKomentarByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id_komentar } = req.params;

    const deleteQuery = "DELETE FROM komentar WHERE id = ?";
    await db.query(deleteQuery, [id_komentar]);

    res.json({ success: true, message: "Komentar berhasil dihapus" });
  } catch (err) {
    console.error('Error hapus komentar by admin:', err);
    res.status(500).json({ error: err.message });
  }
};
