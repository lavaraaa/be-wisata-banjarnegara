const db = require('../db');

const ensureAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Hanya admin yang dapat mengakses data kategori.' });
    return false;
  }
  return true;
};

const normalizeNamaKategori = (nama) => {
  if (typeof nama !== 'string') return '';
  return nama.trim().replace(/\s+/g, ' ');
};

exports.createKategori = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const nama = normalizeNamaKategori(req.body.nama);

    if (!nama) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }

    const [existing] = await db.query(
      'SELECT id FROM kategori_wisata WHERE LOWER(nama) = LOWER(?) LIMIT 1',
      [nama]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Kategori sudah ada.' });
    }

    const [result] = await db.query(
      'INSERT INTO kategori_wisata (nama) VALUES (?)',
      [nama]
    );

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan.',
      data: { id: result.insertId, nama }
    });
  } catch (err) {
    console.error('Error create kategori:', err);
    res.status(500).json({ message: 'Gagal menambah kategori', error: err.message });
  }
};

exports.getAllKategori = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const [rows] = await db.query(
      'SELECT id, nama, created_at FROM kategori_wisata ORDER BY nama ASC'
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error get all kategori:', err);
    res.status(500).json({ message: 'Gagal mengambil data kategori', error: err.message });
  }
};

exports.getPublicKategori = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, created_at FROM kategori_wisata ORDER BY nama ASC'
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error get public kategori:', err);
    res.status(500).json({ message: 'Gagal mengambil data kategori', error: err.message });
  }
};

exports.updateKategori = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const id = Number(req.params.id);
    const nama = normalizeNamaKategori(req.body.nama);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID kategori tidak valid.' });
    }

    if (!nama) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }

    const [exists] = await db.query(
      'SELECT id FROM kategori_wisata WHERE id = ? LIMIT 1',
      [id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    const [duplicate] = await db.query(
      'SELECT id FROM kategori_wisata WHERE LOWER(nama) = LOWER(?) AND id <> ? LIMIT 1',
      [nama, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Nama kategori sudah digunakan.' });
    }

    await db.query(
      'UPDATE kategori_wisata SET nama = ? WHERE id = ?',
      [nama, id]
    );

    res.status(200).json({
      message: 'Kategori berhasil diubah.',
      data: { id, nama }
    });
  } catch (err) {
    console.error('Error update kategori:', err);
    res.status(500).json({ message: 'Gagal mengubah kategori', error: err.message });
  }
};

exports.deleteKategori = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID kategori tidak valid.' });
    }

    const [exists] = await db.query(
      'SELECT id FROM kategori_wisata WHERE id = ? LIMIT 1',
      [id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    const [usage] = await db.query(
      'SELECT COUNT(*) AS total FROM wisata_kategori WHERE kategori_id = ?',
      [id]
    );

    if (usage[0].total > 0) {
      return res.status(409).json({
        message: 'Kategori masih digunakan oleh data wisata dan tidak dapat dihapus.'
      });
    }

    await db.query('DELETE FROM kategori_wisata WHERE id = ?', [id]);

    res.status(200).json({ message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    console.error('Error delete kategori:', err);
    res.status(500).json({ message: 'Gagal menghapus kategori', error: err.message });
  }
};
