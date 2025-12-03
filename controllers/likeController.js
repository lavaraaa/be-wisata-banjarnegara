const db = require('../db');

// LIKE wisata
exports.likeWisata = (req, res) => {
  const userId = req.user.id;
  const { id_wisata } = req.body;

  const query = 'INSERT IGNORE INTO likes (user_id, wisata_id) VALUES (?, ?)';
  db.query(query, [userId, id_wisata], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: 'Berhasil menyukai wisata' });
  });
};

// UNLIKE wisata
exports.unlikeWisata = (req, res) => {
  const userId = req.user.id;
  const { id_wisata } = req.body;

  const query = 'DELETE FROM likes WHERE user_id = ? AND wisata_id = ?';
  db.query(query, [userId, id_wisata], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: 'Unlike berhasil' });
  });
};

// GET total likes
exports.getTotalLikesByWisataId = (req, res) => {
  const { id_wisata } = req.params;

  if (!id_wisata) {
    return res.status(400).json({ message: 'ID wisata diperlukan' });
  }

  const query = 'SELECT COUNT(*) AS totalLikes FROM likes WHERE wisata_id = ?';
  db.query(query, [id_wisata], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil total like' });

    res.json({ totalLikes: result[0].totalLikes });
  });
};

