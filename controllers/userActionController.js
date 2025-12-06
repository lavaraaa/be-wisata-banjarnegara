const db = require("../db");
const jwt = require('jsonwebtoken');
const supabase = require("../supabase");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

exports.updatePhoto = [
  upload.single('photo'),
  async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan.' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Token tidak valid.' });

      const userId = decoded.id;

      if (!req.file) return res.status(400).json({ message: 'File foto tidak ditemukan.' });

      try {
        // 1. Ambil foto lama dari DB
        const [results] = await new Promise((resolve, reject) => {
          db.query('SELECT photoURL FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) reject(err); else resolve([results]);
          });
        });

        const oldPhotoURL = results[0]?.photoURL;
        if (oldPhotoURL) {
          const oldFileName = oldPhotoURL.split('/fotoprofil/')[1];
          if (oldFileName) {
            // Hapus foto lama dari Supabase
            await supabase.storage.from('images').remove([`fotoprofil/${oldFileName}`]);
          }
        }

        // 2. Upload foto baru
        const fileName = `fotoprofil/${Date.now()}_${req.file.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, req.file.buffer, { upsert: true });

        if (uploadError) throw uploadError;

        // 3. Ambil public URL
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

        // 4. Update DB
        db.query('UPDATE users SET photoURL = ? WHERE id = ?', [publicUrl, userId], (err) => {
          if (err) return res.status(500).json({ message: 'Gagal update foto.' });
          res.json({ message: 'Foto profil berhasil diperbarui.', photoURL: publicUrl });
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal upload foto.', error: err.message });
      }
    });
  }
];

// ====================== DELETE FOTO ======================
exports.deletePhoto = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada.' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid.' });

    const userId = decoded.id;

    // Ambil URL foto dari DB
    db.query('SELECT photoURL FROM users WHERE id = ?', [userId], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: 'Gagal mencari data foto user.' });
      }

      const photoURL = results[0].photoURL;
      if (!photoURL) return res.status(400).json({ message: 'Foto tidak ditemukan.' });

      // Ambil nama file dari URL
      // Misal: https://<project>.supabase.co/storage/v1/object/public/images/fotoprofil/1691212345678_avatar.jpg
      const fileName = photoURL.split('/fotoprofil/')[1];
      if (!fileName) return res.status(400).json({ message: 'File tidak valid.' });

      try {
        // Hapus file di Supabase
        const { data, error } = await supabase.storage.from('images').remove([`fotoprofil/${fileName}`]);
        if (error) console.warn('Gagal hapus file Supabase:', error.message);

        // Update DB jadi null
        db.query('UPDATE users SET photoURL = NULL WHERE id = ?', [userId], (err) => {
          if (err) return res.status(500).json({ message: 'Gagal update database.' });
          res.json({ message: 'Foto berhasil dihapus.' });
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal hapus foto.', error: err.message });
      }
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
