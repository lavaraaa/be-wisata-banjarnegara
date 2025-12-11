const db = require('../db');
const fs = require('fs'); // ga gua hapus biar aman
const path = require('path');
const supabase = require('../supabase');

// ===============================
// FUNGSI HAPUS FILE DI SUPABASE
// ===============================
const deleteFromSupabase = async (files = []) => {
  if (!files.length) return;

  const paths = files.map(f => `ulasan/${f}`);

  const { error } = await supabase.storage
    .from('images')
    .remove(paths);

  if (error) console.log('Gagal hapus Supabase:', error);
};

// =======================================================
// CREATE RATING - ASYNC/AWAIT
// =======================================================
exports.createRating = async (req, res) => {
  try {
    console.log('=== [CREATE RATING] ===');

    const userId = req.user.id;
    const { wisata_id, rating, review } = req.body;

    let images = [];

    // ========= UPLOAD FILE KE SUPABASE =========
    if (req.files?.length) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + '-' + Math.round(Math.random() * 9999) + ext;

        const { error } = await supabase.storage
          .from('images')
          .upload(`ulasan/${fileName}`, file.buffer, {
            contentType: file.mimetype
          });

        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Gagal upload gambar' });
        }

        images.push(fileName);
      }
    }

    console.log('userId:', userId);
    console.log('wisata_id:', wisata_id);
    console.log('rating:', rating);
    console.log('review:', review);
    console.log('images:', images);

    if (!wisata_id) {
      return res.status(400).json({ message: 'ID wisata tidak ditemukan' });
    }

    // Check if user already rated
    const [cek] = await db.query(
      'SELECT id FROM rating WHERE user_id = ? AND wisata_id = ?',
      [userId, wisata_id]
    );

    if (cek.length > 0) {
      return res.status(400).json({ message: 'Anda sudah memberi ulasan' });
    }

    // Insert rating
    await db.query(
      'INSERT INTO rating (user_id, wisata_id, rating, review, images) VALUES (?, ?, ?, ?, ?)',
      [userId, wisata_id, rating, review, JSON.stringify(images)]
    );

    res.status(200).json({ message: 'Ulasan berhasil ditambahkan' });
  } catch (err) {
    console.error('Error create rating:', err);
    res.status(500).json({ message: 'Gagal menambah ulasan', error: err.message });
  }
};

// ====================================================
// UPDATE RATING - ASYNC/AWAIT
// ====================================================
exports.updateRating = async (req, res) => {
  try {
    console.log('=== [UPDATE RATING] ===');

    const ratingId = req.params.id;
    const userId = req.user.id;
    const { rating, review } = req.body;
    const keepImages = req.body.keepImages || [];
    const newImages = [];

    console.log('body.rating:', rating);
    console.log('body.review:', review);
    console.log('raw keepImages:', keepImages);

    // ========= UPLOAD GAMBAR BARU KE SUPABASE =========
    if (req.files?.length) {
      for (const f of req.files) {
        const ext = path.extname(f.originalname);
        const fileName = Date.now() + '-' + Math.round(Math.random() * 9999) + ext;

        const { error } = await supabase.storage
          .from('images')
          .upload(`ulasan/${fileName}`, f.buffer, {
            contentType: f.mimetype
          });

        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Gagal upload gambar baru' });
        }

        newImages.push(fileName);
      }
    }

    console.log('newImages:', newImages);

    // Get existing rating
    const [results] = await db.query(
      'SELECT * FROM rating WHERE id = ? AND user_id = ?',
      [ratingId, userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Ulasan tidak ditemukan' });
    }

    const existing = results[0];
    const existingImages = JSON.parse(existing.images || '[]');

    const keep = Array.isArray(keepImages) ? keepImages : [keepImages];
    const finalImages = [...keep, ...newImages];

    // ========= HAPUS GAMBAR LAMA DI SUPABASE =========
    const toDelete = existingImages.filter(img => !keep.includes(img));
    await deleteFromSupabase(toDelete);

    // Update rating
    await db.query(
      'UPDATE rating SET rating = ?, review = ?, images = ? WHERE id = ? AND user_id = ?',
      [rating, review, JSON.stringify(finalImages), ratingId, userId]
    );

    res.json({ message: 'Ulasan berhasil diperbarui' });
  } catch (err) {
    console.error('Error update rating:', err);
    res.status(500).json({ message: 'Gagal mengupdate ulasan', error: err.message });
  }
};

// ===========================================================
// GET ALL BY WISATA - ASYNC/AWAIT
// ===========================================================
exports.getAllByWisata = async (req, res) => {
  try {
    const { wisata_id } = req.params;
    const limit = Number(req.query.limit) || 0;

    const sql = `
      SELECT r.*, u.username, u.email, u.photoURL, u.id AS user_id
      FROM rating r JOIN users u ON r.user_id=u.id
      WHERE r.wisata_id=? ORDER BY r.created_at DESC ${limit ? 'LIMIT ?' : ''}
    `;

    const [rows] = limit
      ? await db.query(sql, [wisata_id, limit])
      : await db.query(sql, [wisata_id]);

    res.json(rows);
  } catch (err) {
    console.error('Error get all by wisata:', err);
    res.status(500).json({ message: 'Gagal mengambil rating', error: err.message });
  }
};

// ===========================================================
// CHECK STATUS - ASYNC/AWAIT
// ===========================================================
exports.status = async (req, res) => {
  try {
    const userId = req.user.id;
    const wisata = req.params.wisata_id;

    const [rows] = await db.query(
      'SELECT id FROM rating WHERE user_id=? AND wisata_id=?',
      [userId, wisata]
    );

    res.json({ hasRated: !!rows.length });
  } catch (err) {
    console.error('Error check status:', err);
    res.status(500).json({ message: 'Gagal cek status', error: err.message });
  }
};

// ===========================================================
// GET ALL RATING BY ADMIN - ASYNC/AWAIT
// ===========================================================
exports.getAllRatingByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat mengakses data ulasan.' });
    }

    const sql = `
      SELECT r.*, u.username, u.email, u.photoURL, w.judul AS nama_wisata
      FROM rating r
      JOIN users u ON r.user_id = u.id
      JOIN wisata w ON r.wisata_id = w.id
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error get all rating by admin:', err);
    res.status(500).json({ message: 'Gagal mengambil data ulasan', error: err.message });
  }
};

// ==========================================================
// DELETE RATING BY ADMIN - WITH TRANSACTION
// ==========================================================
exports.deleteRatingByAdmin = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const ratingId = req.params.id;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat menghapus ulasan.' });
    }

    await connection.beginTransaction();

    // Get rating data
    const [results] = await connection.query('SELECT images FROM rating WHERE id = ?', [ratingId]);

    if (results.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ulasan tidak ditemukan' });
    }

    const images = results[0]?.images ? JSON.parse(results[0].images) : [];

    // Delete from database
    await connection.query('DELETE FROM rating WHERE id = ?', [ratingId]);

    // Commit transaction
    await connection.commit();

    // Delete images from Supabase AFTER successful DB delete
    await deleteFromSupabase(images);

    res.json({ message: 'Ulasan berhasil dihapus' });
  } catch (err) {
    await connection.rollback();
    console.error('Error delete rating:', err);
    res.status(500).json({ message: 'Gagal menghapus ulasan', error: err.message });
  } finally {
    connection.release();
  }
};
