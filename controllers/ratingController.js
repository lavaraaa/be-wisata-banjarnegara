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
// CREATE RATING (UTUH SAMA PUNYA MU, CUMA UPLOAD DIGANTI)
// =======================================================
exports.createRating = async (req, res) => {
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

  if (!wisata_id) return res.status(400).json({ message: 'ID wisata tidak ditemukan' });

  db.query(
    'SELECT id FROM rating WHERE user_id = ? AND wisata_id = ?',
    [userId, wisata_id],
    (err, cek) => {
      if (err) {
        console.error('DB SELECT error:', err);
        return res.status(500).json({ message: 'Gagal mengecek ulasan' });
      }

      if (cek.length > 0) {
        return res.status(400).json({ message: 'Anda sudah memberi ulasan' });
      }

      db.query(
        'INSERT INTO rating (user_id, wisata_id, rating, review, images) VALUES (?, ?, ?, ?, ?)',
        [userId, wisata_id, rating, review, JSON.stringify(images)],
        (err2) => {
          if (err2) {
            console.error('DB INSERT error:', err2);
            return res.status(500).json({ message: 'Gagal menambah ulasan' });
          }

          res.status(200).json({ message: 'Ulasan berhasil ditambahkan' });
        }
      );
    }
  );
};

// ====================================================
// UPDATE RATING (UTUH, CUMA HAPUS/UPLOAD DI SUPABASE)
// ====================================================
exports.updateRating = async (req, res) => {
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

  db.query(
    'SELECT * FROM rating WHERE id = ? AND user_id = ?',
    [ratingId, userId],
    async (err, results) => {
      if (err) {
        console.error('DB SELECT error:', err);
        return res.status(500).json({ message: 'Gagal mengambil data ulasan' });
      }

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

      db.query(
        'UPDATE rating SET rating = ?, review = ?, images = ? WHERE id = ? AND user_id = ?',
        [rating, review, JSON.stringify(finalImages), ratingId, userId],
        (err2) => {
          if (err2) {
            console.error('DB UPDATE error:', err2);
            return res.status(500).json({ message: 'Gagal mengupdate ulasan' });
          }
          res.json({ message: 'Ulasan berhasil diperbarui' });
        }
      );
    }
  );
};

// ===========================================================
// FUNGSI LAIN (UTUH 100% TANPA DIUBAH SELOK PUNGGUNG)
// ===========================================================
exports.getAllByWisata = (req, res) => {
  const { wisata_id } = req.params;
  const limit = Number(req.query.limit) || 0;

  db.query(
    `SELECT r.*, u.username, u.email, u.photoURL, u.id AS user_id
     FROM rating r JOIN users u ON r.user_id=u.id
     WHERE r.wisata_id=? ORDER BY r.created_at DESC ${limit ? 'LIMIT ?' : ''}`,
    limit ? [wisata_id, limit] : [wisata_id],
    (err, rows) =>
      err ? res.status(500).json({ message: 'DB error' }) : res.json(rows)
  );
};

exports.status = (req, res) => {
  const userId = req.user.id;
  const wisata = req.params.wisata_id;

  db.query(
    'SELECT id FROM rating WHERE user_id=? AND wisata_id=?',
    [userId, wisata],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ hasRated: !!rows.length });
    }
  );
};

exports.getAllRatingByAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang dapat mengakses data ulasan.' });
  }

  db.query(
    `SELECT r.*, u.username, u.email, u.photoURL, w.judul AS nama_wisata
     FROM rating r
     JOIN users u ON r.user_id = u.id
     JOIN wisata w ON r.wisata_id = w.id
     ORDER BY r.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Gagal mengambil data ulasan', error: err });
      res.json(rows);
    }
  );
};

// ==========================================================
// DELETE OLEH ADMIN (UTUH, CUMA DELETE GAMBAR KE SUPABASE)
// ==========================================================
exports.deleteRatingByAdmin = (req, res) => {
  const ratingId = req.params.id;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang dapat menghapus ulasan.' });
  }

  db.query('SELECT images FROM rating WHERE id = ?', [ratingId], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil data ulasan', error: err });

    const images = results[0]?.images ? JSON.parse(results[0].images) : [];

    // Hapus gambar dari Supabase
    await deleteFromSupabase(images);

    db.query('DELETE FROM rating WHERE id = ?', [ratingId], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal menghapus ulasan', error: err2 });

      return res.json({ message: 'Ulasan berhasil dihapus' });
    });
  });
};
