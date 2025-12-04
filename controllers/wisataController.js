const db = require('../db');
const supabase = require('../supabase'); // koneksi Supabase

// 🟢 POST wisata
exports.tambahWisata = async (req, res) => {
  const {
    judul, deskripsi, alamat, jam_buka, jam_tutup,
    no_telepon, harga_tiket, link_gmaps, kategori,
    longitude, latitude, kode_wilayah,
  } = req.body;

  let fasilitas = [];
  try {
    fasilitas = req.body.fasilitas ? JSON.parse(req.body.fasilitas) : [];
  } catch (err) {
    return res.status(400).json({ message: 'Fasilitas bukan JSON' });
  }

  // Upload gambar utama ke Supabase
  let gambar = null;
  if (req.files?.gambar?.[0]) {
    const file = req.files.gambar[0];
    const fileName = `${Date.now()}-${file.originalname}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(`utama/${fileName}`, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype,
      });
    if (error) return res.status(500).json({ message: 'Gagal upload gambar utama', error });
    gambar = `utama/${fileName}`;
  }

  // Upload galeri ke Supabase
  const galeri = [];
  if (req.files?.galeri) {
    for (const file of req.files.galeri) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { error } = await supabase.storage
        .from('images')
        .upload(`galeri/${fileName}`, file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype,
        });
      if (error) return res.status(500).json({ message: 'Gagal upload galeri', error });
      galeri.push(`galeri/${fileName}`);
    }
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
    JSON.stringify(fasilitas), JSON.stringify(galeri),
    longitude, latitude, kode_wilayah
  ], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal tambah wisata', err });
    res.status(200).json({ message: 'Wisata berhasil ditambahkan' });
  });
};

// 🟢 EDIT wisata
exports.editWisata = async (req, res) => {
  const { id } = req.params;
  const {
    judul, deskripsi, alamat, jam_buka, jam_tutup,
    no_telepon, harga_tiket, link_gmaps, kategori,
    fasilitas, galeri_lama, event, longitude, latitude, kode_wilayah
  } = req.body;

  let finalFasilitas = [], finalKategori = [], galeriLamaArray = [];
  try {
    finalFasilitas = JSON.parse(fasilitas || '[]');
    finalKategori = JSON.parse(kategori || '[]');
    galeriLamaArray = JSON.parse(galeri_lama || '[]'); // galeri yang dipertahankan
  } catch (e) {
    return res.status(400).json({ message: 'Format JSON tidak valid' });
  }

  // Ambil data lama dari DB
  db.query('SELECT * FROM wisata WHERE id = ?', [id], async (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ message: 'Gagal ambil data lama' });

    const old = results[0];

    // ================================
    // 📌 1. UPLOAD GAMBAR UTAMA BARU
    // ================================
    let finalGambar = old.gambar;

    if (req.files?.gambar?.[0]) {
      // hapus gambar lama di supabase
      if (old.gambar) {
        await supabase.storage.from('images').remove([old.gambar]);
      }

      const file = req.files.gambar[0];
      const fileName = `${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from('images')
        .upload(`utama/${fileName}`, file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype,
        });

      if (error) return res.status(500).json({ message: 'Gagal upload gambar utama', error });

      finalGambar = `utama/${fileName}`;
    }

    // ================================
    // 📌 2. UPLOAD GALERI BARU
    // ================================
    const galeriBaru = [];

    if (req.files?.galeri) {
      for (const file of req.files.galeri) {
        const fileName = `${Date.now()}-${file.originalname}`;

        const { error } = await supabase.storage
          .from('images')
          .upload(`galeri/${fileName}`, file.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.mimetype,
          });

        if (error) return res.status(500).json({ message: 'Gagal upload galeri', error });

        galeriBaru.push(`galeri/${fileName}`);
      }
    }

    // ==========================================
    // 📌 3. HAPUS GAMBAR GALERI YANG DITANGGALIN
    // ==========================================
    const oldGaleri = old.galeri ? JSON.parse(old.galeri) : [];

    // file yang dulu ada, tapi TIDAK ADA di galeri_lama frontend → hapus!
    const galeriAkanHapus = oldGaleri.filter(f => !galeriLamaArray.includes(f));

    if (galeriAkanHapus.length > 0) {
      await supabase.storage.from('images').remove(galeriAkanHapus);
    }

    // ==========================================
    // 📌 4. FINAL GALERI = dipertahankan + yang baru
    // ==========================================
    const finalGaleri = [...galeriLamaArray, ...galeriBaru];

    // ==========================================
    // 📌 5. UPDATE DATABASE
    // ==========================================
    const sqlUpdate = `
      UPDATE wisata SET
        judul = ?, gambar = ?, deskripsi = ?, alamat = ?, jam_buka = ?, jam_tutup = ?,
        no_telepon = ?, harga_tiket = ?, link_gmaps = ?, kategori = ?, fasilitas = ?, galeri = ?,
        event = ?, longitude = ?, latitude = ?, kode_wilayah = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [
      judul, finalGambar, deskripsi, alamat, jam_buka, jam_tutup,
      no_telepon, harga_tiket, link_gmaps,
      JSON.stringify(finalKategori),
      JSON.stringify(finalFasilitas),
      JSON.stringify(finalGaleri),
      event, longitude, latitude, kode_wilayah, id
    ], (err2) => {
      if (err2)
        return res.status(500).json({ message: 'Gagal update wisata', err: err2 });

      res.status(200).json({ message: 'Berhasil update wisata' });
    });
  });
};

// 🟢 DELETE wisata
exports.deleteWisata = async (req, res) => {
  const { id } = req.params;
  // ambil data dulu
  db.query('SELECT gambar, galeri FROM wisata WHERE id = ?', [id], async (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: 'Gagal ambil data' });
    const { gambar, galeri } = results[0];

    // hapus gambar utama
    if (gambar) await supabase.storage.from('images').remove([gambar]);

    // hapus galeri
    if (galeri) {
      const galeriArray = JSON.parse(galeri);
      if (galeriArray.length > 0) await supabase.storage.from('images').remove(galeriArray);
    }

    // hapus data DB
    db.query('DELETE FROM wisata WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal menghapus wisata', err: err2 });
      res.status(200).json({ message: 'Wisata berhasil dihapus' });
    });
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
