const db = require("../db");
const jwt = require('jsonwebtoken');
const supabase = require("../supabase");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.getStatusLikeFavorit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_wisata } = req.params;

    const status = {
      liked: false,
      favorited: false,
    };

    const queryLike = "SELECT * FROM likes WHERE user_id = ? AND wisata_id = ?";
    const queryFavorit = "SELECT * FROM favorit WHERE user_id = ? AND wisata_id = ?";

    const [likeResults] = await db.query(queryLike, [userId, id_wisata]);

    if (likeResults.length > 0) status.liked = true;

    const [favResults] = await db.query(queryFavorit, [userId, id_wisata]);

    if (favResults.length > 0) status.favorited = true;

    res.json(status);
  } catch (err) {
    console.error('Error get status like favorit:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserWisataData = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // OPTIMIZED QUERY - Use LEFT JOIN instead of subquery
    const [liked] = await db.query(`
      SELECT
        w.*,
        COALESCE(likes_count, 0) AS total_likes,
        COALESCE(avg_rating, 0) AS average_rating
      FROM wisata w
      JOIN likes l ON w.id = l.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as likes_count FROM likes GROUP BY wisata_id
      ) lc ON w.id = lc.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
      WHERE l.user_id = ?
    `, [userId]);

    const [saved] = await db.query(`
      SELECT
        w.*,
        COALESCE(likes_count, 0) AS total_likes,
        COALESCE(avg_rating, 0) AS average_rating
      FROM wisata w
      JOIN favorit f ON w.id = f.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as likes_count FROM likes GROUP BY wisata_id
      ) lc ON w.id = lc.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
      WHERE f.user_id = ?
    `, [userId]);

    res.json({ disukai: liked, disimpan: saved });
  } catch (err) {
    console.error('Error get user wisata data:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token tidak valid' });
    }
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

exports.updatePhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Token tidak ditemukan.' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      if (!req.file) return res.status(400).json({ message: 'File foto tidak ditemukan.' });

      // 1. Ambil foto lama dari DB
      const [results] = await db.query('SELECT photoURL FROM users WHERE id = ?', [userId]);

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
      await db.query('UPDATE users SET photoURL = ? WHERE id = ?', [publicUrl, userId]);

      res.json({ message: 'Foto profil berhasil diperbarui.', photoURL: publicUrl });
    } catch (err) {
      console.error('Error update photo:', err);
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Token tidak valid.' });
      }
      res.status(500).json({ message: 'Gagal upload foto.', error: err.message });
    }
  }
];

// ====================== DELETE FOTO ======================
exports.deletePhoto = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ada.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Ambil URL foto dari DB
    const [results] = await db.query('SELECT photoURL FROM users WHERE id = ?', [userId]);

    if (results.length === 0) {
      return res.status(500).json({ message: 'Gagal mencari data foto user.' });
    }

    const photoURL = results[0].photoURL;
    if (!photoURL) return res.status(400).json({ message: 'Foto tidak ditemukan.' });

    // Ambil nama file dari URL
    const fileName = photoURL.split('/fotoprofil/')[1];
    if (!fileName) return res.status(400).json({ message: 'File tidak valid.' });

    // Hapus file di Supabase
    const { error } = await supabase.storage.from('images').remove([`fotoprofil/${fileName}`]);
    if (error) console.warn('Gagal hapus file Supabase:', error.message);

    // Update DB jadi null
    await db.query('UPDATE users SET photoURL = NULL WHERE id = ?', [userId]);

    res.json({ message: 'Foto berhasil dihapus.' });
  } catch (err) {
    console.error('Error delete photo:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token tidak valid.' });
    }
    res.status(500).json({ message: 'Gagal hapus foto.', error: err.message });
  }
};

exports.getUserWisataById = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'ID user tidak ditemukan' });

    // OPTIMIZED QUERY - Use LEFT JOIN
    const [liked] = await db.query(
      `SELECT
         w.*,
         COALESCE(likes_count, 0) AS total_likes,
         COALESCE(avg_rating, 0) AS average_rating
       FROM wisata w
       JOIN likes l ON w.id = l.wisata_id
       LEFT JOIN (
         SELECT wisata_id, COUNT(*) as likes_count FROM likes GROUP BY wisata_id
       ) lc ON w.id = lc.wisata_id
       LEFT JOIN (
         SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
       ) r ON w.id = r.wisata_id
       WHERE l.user_id = ?`,
      [id]
    );

    const [saved] = await db.query(
      `SELECT
         w.*,
         COALESCE(likes_count, 0) AS total_likes,
         COALESCE(avg_rating, 0) AS average_rating
       FROM wisata w
       JOIN favorit f ON w.id = f.wisata_id
       LEFT JOIN (
         SELECT wisata_id, COUNT(*) as likes_count FROM likes GROUP BY wisata_id
       ) lc ON w.id = lc.wisata_id
       LEFT JOIN (
         SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
       ) r ON w.id = r.wisata_id
       WHERE f.user_id = ?`,
      [id]
    );

    res.json({ disukai: liked, disimpan: saved });
  } catch (err) {
    console.error('Error get user wisata by id:', err);
    res.status(500).json({ message: 'Gagal ambil data', error: err.message });
  }
};
