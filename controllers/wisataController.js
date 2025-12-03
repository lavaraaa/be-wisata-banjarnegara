const db = require('../db');
const fs = require('fs');
const path = require('path');

// 🟢 POST wisata
exports.tambahWisata = (req, res) => {
  const {
    judul,
    deskripsi,
    alamat,
    jam_buka,
    jam_tutup,
    no_telepon,
    harga_tiket,
    link_gmaps,
    kategori,
    longitude,
    latitude,
    kode_wilayah,
  } = req.body;

  const gambar = req.files?.gambar?.[0]?.filename || null;
  const galeriFiles = req.files?.galeri || [];
  const galeri = galeriFiles.map(file => file.filename);

  let fasilitas = [];
  try {
    fasilitas = req.body.fasilitas ? JSON.parse(req.body.fasilitas) : [];
  } catch (err) {
    console.error('Fasilitas error:', err);
    return res.status(400).json({ message: 'Fasilitas bukan JSON' });
  }

  const sql = `
    INSERT INTO wisata (
      judul, gambar, deskripsi, alamat, jam_buka, jam_tutup,
      no_telepon, harga_tiket, link_gmaps, kategori, fasilitas, galeri, 
      longitude, latitude, kode_wilayah
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    judul, gambar, deskripsi, alamat, jam_buka, jam_tutup,
    no_telepon, harga_tiket, link_gmaps, kategori,
    JSON.stringify(fasilitas), JSON.stringify(galeri)
  ], (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Gagal tambah wisata' });
    }
    res.status(200).json({ message: 'Wisata berhasil ditambahkan' });
  });
};

// 🟢 GET semua wisata
exports.getAllWisata = (req, res) => {
  const sql = `
    SELECT 
      w.*, 
      (
        SELECT COUNT(*) 
        FROM likes l 
        WHERE l.wisata_id = w.id
      ) AS total_likes,
      (
        SELECT COUNT(*) 
        FROM favorit l 
        WHERE l.wisata_id = w.id
      ) AS total_favorit,
      (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM rating r
        WHERE r.wisata_id = w.id
      ) AS average_rating
    FROM wisata w
  `;

  db.query(sql, (err, result) => {
    if (err)
      return res.status(500).json({ message: 'Gagal mengambil data wisata', error: err });
    res.json(result);
  });
};

// 🟢 GET wisata by ID
exports.getWisataById = (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID tidak valid' });
  }

  const sql = 'SELECT * FROM wisata WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Gagal mengambil detail wisata:', err);
      return res.status(500).json({ message: 'Gagal mengambil detail wisata' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Wisata tidak ditemukan' });
    }

    res.status(200).json(results[0]);
  });
};

exports.editWisata = (req, res) => {
  const { id } = req.params;

  const {
    judul,
    deskripsi,
    alamat,
    jam_buka,
    jam_tutup,
    no_telepon,
    harga_tiket,
    link_gmaps,
    kategori,
    fasilitas,
    galeri_lama,
    event,
    longitude,
    latitude,
  kode_wilayah
  } = req.body;

  // Gambar baru dari upload
  const gambarBaru = req.files?.gambar?.[0]?.filename || null;

  // Galeri baru dari upload
  const galeriBaru = req.files?.galeri?.map(file => file.filename) || [];

  let finalFasilitas = [];
  let finalKategori = [];
  let galeriLamaArray = [];

  try {
    finalFasilitas = JSON.parse(fasilitas || '[]');
    finalKategori = JSON.parse(kategori || '[]');
    galeriLamaArray = JSON.parse(galeri_lama || '[]');
  } catch (e) {
    return res.status(400).json({ message: 'Format fasilitas/kategori/galeri_lama tidak valid' });
  }

  // Ambil data lama dari database
  const sqlSelect = 'SELECT * FROM wisata WHERE id = ?';
  db.query(sqlSelect, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'Gagal ambil data lama' });
    }

    const old = results[0];

    // Gunakan gambarBaru jika ada dan valid, kalau tidak pakai gambar lama
    const finalGambar =
      gambarBaru && gambarBaru.trim() !== '' ? gambarBaru :
      old.gambar && old.gambar.trim() !== '' ? old.gambar :
      null;

    // Safety check: gambar gak boleh null
    if (!finalGambar) {
      return res.status(400).json({ message: 'Gambar tidak valid atau kosong' });
    }

    const finalGaleri = [...galeriLamaArray, ...galeriBaru];

    const sqlUpdate = `
      UPDATE wisata SET
        judul = ?,
        gambar = ?,
        deskripsi = ?,
        alamat = ?,
        jam_buka = ?,
        jam_tutup = ?,
        no_telepon = ?,
        harga_tiket = ?,
        link_gmaps = ?,
        kategori = ?,
        fasilitas = ?,
        galeri = ?,
        event = ?,
        longitude = ?,
        latitude = ?,
        kode_wilayah = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [
      judul,
      finalGambar,
      deskripsi,
      alamat,
      jam_buka,
      jam_tutup,
      no_telepon,
      harga_tiket,
      link_gmaps,
      JSON.stringify(finalKategori),
      JSON.stringify(finalFasilitas),
      JSON.stringify(finalGaleri),
      event,
      longitude,
      latitude,
      kode_wilayah,
      id
    ], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: 'Gagal update wisata' });
      }

      return res.status(200).json({ message: 'Berhasil update wisata' });
    });
  });
};


// 🟢 DELETE wisata by ID
exports.deleteWisata = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM wisata WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Gagal menghapus wisata:', err);
      return res.status(500).json({ message: 'Gagal menghapus wisata' });
    }

    res.status(200).json({ message: 'Wisata berhasil dihapus' });
  });
};

exports.updateEvent = (req, res) => {
  const { id } = req.params;
  const { event } = req.body;

  if (event === undefined) {
    return res.status(400).json({ message: 'Field event wajib dikirim' });
  }

  const sql = `UPDATE wisata SET event = ? WHERE id = ?`;

  db.query(sql, [event, id], (err, result) => {
    if (err) {
      console.error('Gagal update event:', err);
      return res.status(500).json({ message: 'Gagal update event' });
    }

    return res.status(200).json({ message: 'Event berhasil diupdate' });
  });
};
