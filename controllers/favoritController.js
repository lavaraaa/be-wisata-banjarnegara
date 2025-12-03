const db = require("../db");

// SIMPAN FAVORIT
exports.simpanFavorit = (req, res) => {
  const userId = req.user.id;
  const { id_wisata } = req.body;

  const query = "INSERT IGNORE INTO favorit (user_id, wisata_id) VALUES (?, ?)";
  db.query(query, [userId, id_wisata], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Berhasil disimpan ke favorit" });
  });
};

// HAPUS FAVORIT
exports.hapusFavorit = (req, res) => {
  const userId = req.user.id;
  const { id_wisata } = req.body;

  const query = "DELETE FROM favorit WHERE user_id = ? AND wisata_id = ?";
  db.query(query, [userId, id_wisata], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Dihapus dari favorit" });
  });
};

// GET total likes
exports.getTotalFavoritByWisataId = (req, res) => {
  const { id_wisata } = req.params;

  if (!id_wisata) {
    return res.status(400).json({ message: 'ID wisata diperlukan' });
  }

  const query = 'SELECT COUNT(*) AS totalFavorit FROM favorit WHERE wisata_id = ?';
  db.query(query, [id_wisata], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil total favorit' });

    res.json({ totalFavorit: result[0].totalFavorit });
  });
};