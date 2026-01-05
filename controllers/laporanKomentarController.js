const db = require('../db');

// 🔴 USER: Laporkan komentar
exports.laporkanKomentar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { komentar_id, alasan } = req.body;

    const checkQuery = `
      SELECT id FROM laporan_komentar
      WHERE komentar_id = ? AND pelapor_id = ?
    `;

    const [result] = await db.query(checkQuery, [komentar_id, userId]);

    if (result.length > 0) {
      return res.status(400).json({ message: 'Komentar sudah dilaporkan' });
    }

    const insertQuery = `
      INSERT INTO laporan_komentar (komentar_id, pelapor_id, alasan)
      VALUES (?, ?, ?)
    `;

    await db.query(insertQuery, [komentar_id, userId, alasan]);

    res.status(200).json({ message: 'Komentar berhasil dilaporkan' });
  } catch (err) {
    console.error('Error lapor komentar:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses laporan', error: err.message });
  }
};

// 🟡 ADMIN: Lihat semua laporan komentar
exports.getLaporanKomentar = async (req, res) => {
  try {
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

    const [result] = await db.query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error get laporan komentar:', err);
    res.status(500).json({ message: 'Gagal mengambil laporan komentar', error: err.message });
  }
};

// 🔵 ADMIN: Hapus laporan saja
exports.hapusLaporanKomentar = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM laporan_komentar WHERE id = ?', [id]);

    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (err) {
    console.error('Error hapus laporan:', err);
    res.status(500).json({ message: 'Gagal menghapus laporan', error: err.message });
  }
};

// 🔴 ADMIN: Hapus komentar + semua laporan terhadap komentar itu - WITH TRANSACTION
exports.hapusKomentarDanLaporan = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { komentar_id } = req.params;

    await connection.beginTransaction();

    // Hapus dulu laporan-laporan terkait
    await connection.query('DELETE FROM laporan_komentar WHERE komentar_id = ?', [komentar_id]);

    // Lalu hapus komentarnya
    await connection.query('DELETE FROM komentar WHERE id = ?', [komentar_id]);

    await connection.commit();

    res.json({ message: 'Komentar dan laporan terkait berhasil dihapus' });
  } catch (err) {
    await connection.rollback();
    console.error('Error hapus komentar dan laporan:', err);
    res.status(500).json({ message: 'Gagal menghapus komentar dan laporan', error: err.message });
  } finally {
    connection.release();
  }
};
