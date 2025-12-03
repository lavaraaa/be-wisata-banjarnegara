const db = require("../db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

exports.getStatusLikeFavorit = (req, res) => {
  const userId = req.user.id;
  const { id_wisata } = req.params;

  const status = {
    liked: false,
    favorited: false,
  };

  const queryLike = "SELECT * FROM likes WHERE user_id = ? AND wisata_id = ?";
  const queryFavorit = "SELECT * FROM favorit WHERE user_id = ? AND wisata_id = ?";

  db.query(queryLike, [userId, id_wisata], (err, likeResults) => {
    if (err) return res.status(500).json({ error: err });

    if (likeResults.length > 0) status.liked = true;

    db.query(queryFavorit, [userId, id_wisata], (err, favResults) => {
      if (err) return res.status(500).json({ error: err });

      if (favResults.length > 0) status.favorited = true;

      res.json(status);
    });
  });
};

exports.getUserWisataData = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    const userId = decoded.id;

    db.query(`
      SELECT 
        w.*, 
        (
          SELECT COUNT(*) FROM likes l2 WHERE l2.wisata_id = w.id
        ) AS total_likes,
        (
          SELECT COALESCE(AVG(r.rating), 0) FROM rating r WHERE r.wisata_id = w.id
        ) AS average_rating
      FROM wisata w 
      JOIN likes l ON w.id = l.wisata_id 
      WHERE l.user_id = ?
    `, [userId], (err, liked) => {
      if (err) return res.status(500).json({ message: 'Gagal ambil disukai' });

      db.query(`
        SELECT 
          w.*, 
          (
            SELECT COUNT(*) FROM likes l2 WHERE l2.wisata_id = w.id
          ) AS total_likes,
          (
            SELECT COALESCE(AVG(r.rating), 0) FROM rating r WHERE r.wisata_id = w.id
          ) AS average_rating
        FROM wisata w 
        JOIN favorit f ON w.id = f.wisata_id 
        WHERE f.user_id = ?
      `, [userId], (err2, saved) => {
        if (err2) return res.status(500).json({ message: 'Gagal ambil disimpan' });

        res.json({ disukai: liked, disimpan: saved });
      });
    });
  });
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

exports.updatePhoto = [
  upload.single('photo'),
  (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Token tidak valid.' });

      const userId = decoded.id;
      const photoURL = `http://localhost:3000/uploads/${req.file.filename}`;

      db.query('UPDATE users SET photoURL = ? WHERE id = ?', [photoURL, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Gagal update foto.' });
        res.json({ message: 'Foto profil berhasil diperbarui.', photoURL });
      });
    });
  }
];
exports.deletePhoto = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid.' });

    const userId = user.id;

    db.query('SELECT photoURL FROM users WHERE id = ?', [userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: 'Gagal mencari data foto user.' });
      }

      const photoURL = results[0].photoURL;
      if (!photoURL) {
        return res.status(400).json({ message: 'Foto tidak ditemukan.' });
      }

      const filename = photoURL.split('/uploads/')[1];
      const filePath = path.join(__dirname, '../uploads', filename);

      // Hapus file dari folder uploads
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Gagal hapus file fisik:', err.message);

        // Update DB jadi null
        db.query('UPDATE users SET photoURL = NULL WHERE id = ?', [userId], (err) => {
          if (err) return res.status(500).json({ message: 'Gagal update database.' });
          res.json({ message: 'Foto berhasil dihapus.' });
        });
      });
    });
  });
};

exports.getUserWisataById = (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'ID user tidak ditemukan' });

  db.query(
    `SELECT 
       w.*,
       (SELECT COUNT(*) FROM likes l2 WHERE l2.wisata_id = w.id) AS total_likes,
       (SELECT COALESCE(AVG(r.rating), 0) FROM rating r WHERE r.wisata_id = w.id) AS average_rating
     FROM wisata w 
     JOIN likes l ON w.id = l.wisata_id 
     WHERE l.user_id = ?`,
    [id],
    (err, liked) => {
      if (err) return res.status(500).json({ message: 'Gagal ambil disukai' });

      db.query(
        `SELECT 
           w.*,
           (SELECT COUNT(*) FROM likes l2 WHERE l2.wisata_id = w.id) AS total_likes,
           (SELECT COALESCE(AVG(r.rating), 0) FROM rating r WHERE r.wisata_id = w.id) AS average_rating
         FROM wisata w 
         JOIN favorit f ON w.id = f.wisata_id 
         WHERE f.user_id = ?`,
        [id],
        (err2, saved) => {
          if (err2) return res.status(500).json({ message: 'Gagal ambil disimpan' });

          res.json({ disukai: liked, disimpan: saved });
        }
      );
    }
  );
};
