const db = require('../db');

// 🔴 USER: Laporkan komentar
exports.laporkanKomentar = (req, res) => {
  const userId = req.user.id;
  const { komentar_id, alasan } = req.body;

  const checkQuery = `
    SELECT id FROM laporan_komentar 
    WHERE komentar_id = ? AND pelapor_id = ?
  `;

  db.query(checkQuery, [komentar_id, userId], (err, result) => {
    if (err) {
      console.error('Gagal cek laporan komentar:', err);
      return res.status(500).json({ message: 'Terjadi kesalahan saat memproses laporan' });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'Kamu sudah melaporkan komentar ini' });
    }

    const insertQuery = `
      INSERT INTO laporan_komentar (komentar_id, pelapor_id, alasan)
      VALUES (?, ?, ?)
    `;

    db.query(insertQuery, [komentar_id, userId, alasan], (err2) => {
      if (err2) {
        console.error('Gagal lapor komentar:', err2);
        return res.status(500).json({ message: 'Gagal melaporkan komentar' });
      }

      res.status(200).json({ message: 'Komentar berhasil dilaporkan' });
    });
  });
};

// 🟡 ADMIN: Lihat semua laporan komentar
exports.getLaporanKomentar = (req, res) => {
  const query = `
  SELECT l.id AS laporan_id, k.id AS komentar_id, k.isi, k.created_at,
       u1.username AS pelapor_username, u1.email AS pelapor_email,
       u2.username AS pemilik_username, u2.email AS pemilik_email,
       u2.photoURL AS foto_komentar,
       l.alasan, l.tanggal_lapor,
       w.id AS id_wisata, w.judul AS judul_wisata
FROM laporan_komentar l
JOIN komentar k ON l.komentar_id = k.id
JOIN users u1 ON l.pelapor_id = u1.id
JOIN users u2 ON k.user_id = u2.id
JOIN wisata w ON k.wisata_id = w.id
ORDER BY l.tanggal_lapor DESC

  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error('Gagal ambil laporan komentar:', err);
      return res.status(500).json({ message: 'Gagal mengambil laporan komentar' });
    }
    res.status(200).json(result);
  });
};

// 🔵 ADMIN: Hapus laporan saja
exports.hapusLaporanKomentar = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM laporan_komentar WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Gagal hapus laporan:', err);
      return res.status(500).json({ message: 'Gagal menghapus laporan' });
    }
    res.json({ message: 'Laporan berhasil dihapus' });
  });
};

// 🔴 ADMIN: Hapus komentar + semua laporan terhadap komentar itu
exports.hapusKomentarDanLaporan = (req, res) => {
  const { komentar_id } = req.params;

  // Hapus dulu laporan-laporan terkait
  const deleteLaporanQuery = 'DELETE FROM laporan_komentar WHERE komentar_id = ?';
  db.query(deleteLaporanQuery, [komentar_id], (err1) => {
    if (err1) {
      console.error('Gagal hapus laporan terkait:', err1);
      return res.status(500).json({ message: 'Gagal menghapus laporan terkait komentar' });
    }

    // Lalu hapus komentarnya
    const deleteKomentarQuery = 'DELETE FROM komentar WHERE id = ?';
    db.query(deleteKomentarQuery, [komentar_id], (err2) => {
      if (err2) {
        console.error('Gagal hapus komentar:', err2);
        return res.status(500).json({ message: 'Gagal menghapus komentar' });
      }

      res.json({ message: 'Komentar dan laporan terkait berhasil dihapus' });
    });
  });
};

