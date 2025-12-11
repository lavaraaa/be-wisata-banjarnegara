const db = require('../db');

// LIKE wisata
exports.likeWisata = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata } = req.body;

    const query = 'INSERT IGNORE INTO likes (user_id, wisata_id) VALUES (?, ?)';
    await db.query(query, [userId, id_wisata]);

    res.json({ success: true, message: 'Berhasil menyukai wisata' });
  } catch (err) {
    console.error('Error like wisata:', err);
    res.status(500).json({ error: err.message });
  }
};

// UNLIKE wisata
exports.unlikeWisata = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata } = req.body;

    const query = 'DELETE FROM likes WHERE user_id = ? AND wisata_id = ?';
    await db.query(query, [userId, id_wisata]);

    res.json({ success: true, message: 'Unlike berhasil' });
  } catch (err) {
    console.error('Error unlike wisata:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET total likes
exports.getTotalLikesByWisataId = async (req, res) => {
  try {
    const { id_wisata } = req.params;

    if (!id_wisata) {
      return res.status(400).json({ message: 'ID wisata diperlukan' });
    }

    const query = 'SELECT COUNT(*) AS totalLikes FROM likes WHERE wisata_id = ?';
    const [result] = await db.query(query, [id_wisata]);

    res.json({ totalLikes: result[0].totalLikes });
  } catch (err) {
    console.error('Error get total likes:', err);
    res.status(500).json({ message: 'Gagal mengambil total like', error: err.message });
  }
};

