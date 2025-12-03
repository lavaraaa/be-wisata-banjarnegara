const db = require('../db');
const fs = require('fs');
const path = require('path');

const delOldImageFiles = (oldJson, keepList = []) => {
  try {
    JSON.parse(oldJson || '[]').forEach(f => {
      if (keepList.includes(f)) return;
      const filePath = path.join(__dirname, '..', 'uploads', 'ulasan', f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  } catch {}
};

exports.createRating = (req, res) => {
  console.log('=== [CREATE RATING] ===');

  const userId = req.user.id;
  const { wisata_id, rating, review } = req.body;
  const images = req.files?.map(file => file.filename) || [];

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

exports.updateRating = (req, res) => {
  console.log('=== [UPDATE RATING] ===');

  const ratingId = req.params.id;
  const userId = req.user.id;
  const { rating, review } = req.body;
  const keepImages = req.body.keepImages || [];
  const newImages = req.files?.map(f => f.filename) || [];

  console.log('body.rating:', rating);
  console.log('body.review:', review);
  console.log('raw keepImages:', keepImages);
  console.log('newImages:', newImages);

   db.query('SELECT * FROM rating WHERE id = ? AND user_id = ?', [ratingId, userId], (err, results) => {
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

    const toDelete = existingImages.filter(img => !keep.includes(img));
    toDelete.forEach(img => {
      const filePath = path.join(__dirname, '../uploads/ulasan', img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

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
  });
};


exports.getAllByWisata = (req, res) => {
  const { wisata_id } = req.params;
  const limit = Number(req.query.limit) || 0;

  db.query(`SELECT r.*, u.username, u.email, u.photoURL, u.id AS user_id
            FROM rating r JOIN users u ON r.user_id=u.id
            WHERE r.wisata_id=? ORDER BY r.created_at DESC ${limit ? 'LIMIT ?' : ''}`,
    limit ? [wisata_id, limit] : [wisata_id],
    (err, rows) => err ? res.status(500).json({ message: 'DB error' }) : res.json(rows)
  );
};

exports.status = (req, res) => {
  const userId = req.user.id;
  const wisata = req.params.wisata_id;

  db.query('SELECT id FROM rating WHERE user_id=? AND wisata_id=?', [userId, wisata],
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

exports.deleteRatingByAdmin = (req, res) => {
  const ratingId = req.params.id;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang dapat menghapus ulasan.' });
  }

  db.query('SELECT images FROM rating WHERE id = ?', [ratingId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil data ulasan', error: err });

    const images = results[0]?.images ? JSON.parse(results[0].images) : [];

    db.query('DELETE FROM rating WHERE id = ?', [ratingId], (err2, results2) => {
      if (err2) return res.status(500).json({ message: 'Gagal menghapus ulasan', error: err2 });

      images.forEach(img => {
        const filePath = path.join(__dirname, '../uploads/ulasan', img);
        fs.unlink(filePath, err => {
          if (err) console.error('Gagal menghapus gambar:', img, err.message);
        });
      });

      return res.json({ message: 'Ulasan berhasil dihapus' });
    });
  });
};