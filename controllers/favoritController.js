const db = require("../db");

// SIMPAN FAVORIT
exports.simpanFavorit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata } = req.body;

    const query = "INSERT IGNORE INTO favorit (user_id, wisata_id) VALUES (?, ?)";
    await db.query(query, [userId, id_wisata]);

    res.json({ success: true, message: "Berhasil disimpan ke favorit" });
  } catch (err) {
    console.error('Error simpan favorit:', err);
    res.status(500).json({ error: err.message });
  }
};

// HAPUS FAVORIT
exports.hapusFavorit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata } = req.body;

    const query = "DELETE FROM favorit WHERE user_id = ? AND wisata_id = ?";
    await db.query(query, [userId, id_wisata]);

    res.json({ success: true, message: "Dihapus dari favorit" });
  } catch (err) {
    console.error('Error hapus favorit:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET total likes
exports.getTotalFavoritByWisataId = async (req, res) => {
  try {
    const { id_wisata } = req.params;

    if (!id_wisata) {
      return res.status(400).json({ message: 'ID wisata diperlukan' });
    }

    const query = 'SELECT COUNT(*) AS totalFavorit FROM favorit WHERE wisata_id = ?';
    const [result] = await db.query(query, [id_wisata]);

    res.json({ totalFavorit: result[0].totalFavorit });
  } catch (err) {
    console.error('Error get total favorit:', err);
    res.status(500).json({ message: 'Gagal mengambil total favorit', error: err.message });
  }
};