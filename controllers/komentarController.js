const db = require('../db');
const jwt = require('jsonwebtoken');

// Tambah komentar
exports.komentarWisata = (req, res) => {
  const userId = req.user.id;
  const { id_wisata, isi, parent_id } = req.body;

  const query = "INSERT INTO komentar (user_id, wisata_id, isi, parent_id) VALUES (?, ?, ?, ?)";
  db.query(query, [userId, id_wisata, isi, parent_id || null], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Komentar berhasil ditambahkan" });
  });
};

// Edit komentar (oleh pemilik)
exports.editKomentar = (req, res) => {
  const userId = req.user.id;
  const { id_komentar } = req.params;
  const { isi } = req.body;

  const cekQuery = "SELECT * FROM komentar WHERE id = ? AND user_id = ?";
  db.query(cekQuery, [id_komentar, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0) {
      return res.status(403).json({ error: "Tidak diizinkan mengedit komentar ini" });
    }

    const updateQuery = "UPDATE komentar SET isi = ? WHERE id = ?";
    db.query(updateQuery, [isi, id_komentar], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true, message: "Komentar berhasil diupdate" });
    });
  });
};

// Hapus komentar (oleh pemilik atau admin)
exports.hapusKomentar = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id_komentar } = req.params;

  const cekQuery = "SELECT * FROM komentar WHERE id = ?";
  db.query(cekQuery, [id_komentar], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    const komentar = results[0];

    if (komentar.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: "Tidak diizinkan menghapus komentar ini" });
    }

    const deleteQuery = "DELETE FROM komentar WHERE id = ?";
    db.query(deleteQuery, [id_komentar], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true, message: "Komentar berhasil dihapus" });
    });
  });
};

// Ambil semua komentar berdasarkan id_wisata
exports.getKomentarByWisata = (req, res) => {
  const idWisata = req.params.id_wisata;

  const sql = `
    SELECT k.id AS komentar_id, k.user_id, k.isi, k.created_at, k.parent_id,
           u.username, u.email, u.photoURL
    FROM komentar k
    JOIN users u ON k.user_id = u.id
    WHERE k.wisata_id = ?
    ORDER BY k.created_at DESC
  `;

  db.query(sql, [idWisata], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Ambil semua komentar dengan data user dan wisata untuk admin
exports.getAllKomentarForAdmin = (req, res) => {
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

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Hapus komentar oleh admin
exports.hapusKomentarByAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied" });
  }

  const { id_komentar } = req.params;

  const deleteQuery = "DELETE FROM komentar WHERE id = ?";
  db.query(deleteQuery, [id_komentar], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Komentar berhasil dihapus" });
  });
};
