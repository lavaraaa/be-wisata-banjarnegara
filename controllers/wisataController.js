const db = require('../db');
const supabase = require('../supabase'); // koneksi Supabase

// Helper function untuk sync ke Vector DB
const VECTOR_DB_URL = 'https://be-express-wisata-banjarnegara-production.up.railway.app/tourism/documents';

const syncToVectorDB = async (wisataData) => {
  const {
    id, judul, deskripsi, alamat, jam_buka, jam_tutup,
    no_telepon, harga_tiket, kategori, fasilitas,
    latitude, longitude, kode_wilayah
  } = wisataData;

  // Format kategori dan fasilitas jika array
  const kategoriStr = Array.isArray(kategori) ? kategori.join(', ') : (kategori || '-');
  const fasilitasStr = Array.isArray(fasilitas) ? fasilitas.join(', ') : (fasilitas || '-');

  // Buat dokumen lengkap dengan semua informasi wisata
  const document = [
    `Judul: ${judul || '-'}`,
    `Deskripsi: ${deskripsi || '-'}`,
    `Alamat: ${alamat || '-'}`,
    `Jam Buka: ${jam_buka || '-'}`,
    `Jam Tutup: ${jam_tutup || '-'}`,
    `No. Telepon: ${no_telepon || '-'}`,
    `Harga Tiket: ${harga_tiket || '-'}`,
    `Kategori: ${kategoriStr}`,
    `Fasilitas: ${fasilitasStr}`
  ].join('\n');

  const body = {
    ids: [String(id)],
    documents: [document],
    metadatas: [{
      title: judul,
      kode_wilayah: kode_wilayah || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0
    }]
  };

  const response = await fetch(VECTOR_DB_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Vector DB sync failed: ${response.statusText}`);
  }

  return response.json();
};

const deleteFromVectorDB = async (id) => {
  const response = await fetch(VECTOR_DB_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [String(id)] })
  });

  if (!response.ok) {
    throw new Error(`Vector DB delete failed: ${response.statusText}`);
  }

  return response.json();
};

// 🟢 POST wisata
exports.tambahWisata = async (req, res) => {
  try {
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

    const [result] = await db.query(sql, [
      judul, gambar, deskripsi, alamat, jam_buka, jam_tutup,
      no_telepon, harga_tiket, link_gmaps, kategori,
      JSON.stringify(fasilitas), JSON.stringify(galeri),
      longitude, latitude, kode_wilayah
    ]);

    // Sync ke vector DB (fire-and-forget, tidak blocking response)
    syncToVectorDB({
      id: result.insertId,
      judul, deskripsi, alamat, jam_buka, jam_tutup,
      no_telepon, harga_tiket, kategori, fasilitas,
      latitude, longitude, kode_wilayah
    }).catch(err => console.error('Vector DB sync error:', err));

    res.status(200).json({ message: 'Wisata berhasil ditambahkan' });
  } catch (err) {
    console.error('Error tambah wisata:', err);
    res.status(500).json({ message: 'Gagal tambah wisata', error: err.message });
  }
};

// 🟢 EDIT wisata
exports.editWisata = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judul, deskripsi, alamat, jam_buka, jam_tutup,
      no_telepon, harga_tiket, link_gmaps, kategori,
      fasilitas, galeri_lama, longitude, latitude, kode_wilayah
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
    const [results] = await db.query('SELECT * FROM wisata WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Wisata tidak ditemukan' });
    }

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

    // Gunakan Promise.all untuk UPDATE DB dan sync vector DB secara paralel
    await Promise.all([
      db.query(sqlUpdate, [
        judul, finalGambar, deskripsi, alamat, jam_buka, jam_tutup,
        no_telepon, harga_tiket, link_gmaps,
        JSON.stringify(finalKategori),
        JSON.stringify(finalFasilitas),
        JSON.stringify(finalGaleri),
        longitude, latitude, kode_wilayah, id
      ]),
      syncToVectorDB({
        id, judul, deskripsi, alamat, jam_buka, jam_tutup,
        no_telepon, harga_tiket,
        kategori: finalKategori, fasilitas: finalFasilitas,
        latitude, longitude, kode_wilayah
      }).catch(err => console.error('Vector DB sync error:', err))
    ]);

    res.status(200).json({ message: 'Berhasil update wisata' });
  } catch (err) {
    console.error('Error edit wisata:', err);
    res.status(500).json({ message: 'Gagal update wisata', error: err.message });
  }
};

// 🟢 DELETE wisata
exports.deleteWisata = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Ambil data dulu
    const [results] = await connection.query(
      'SELECT gambar, galeri FROM wisata WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Wisata tidak ditemukan' });
    }

    const { gambar, galeri } = results[0];

    // Hapus data dari database first
    await connection.query('DELETE FROM wisata WHERE id = ?', [id]);

    // Commit transaction
    await connection.commit();

    // Delete files and Vector DB AFTER successful DB delete (di luar transaction)
    const cleanupPromises = [];

    // Delete from Vector DB
    cleanupPromises.push(
      deleteFromVectorDB(id).catch(err => console.error('Vector DB delete error:', err))
    );

    // Delete gambar utama
    if (gambar) {
      cleanupPromises.push(supabase.storage.from('images').remove([gambar]));
    }

    // Delete galeri
    if (galeri) {
      const galeriArray = JSON.parse(galeri);
      if (galeriArray.length > 0) {
        cleanupPromises.push(supabase.storage.from('images').remove(galeriArray));
      }
    }

    await Promise.all(cleanupPromises);

    res.status(200).json({ message: 'Wisata berhasil dihapus' });
  } catch (err) {
    await connection.rollback();
    console.error('Error delete wisata:', err);
    res.status(500).json({ message: 'Gagal menghapus wisata', error: err.message });
  } finally {
    connection.release();
  }
};

// 🟢 GET semua wisata - OPTIMIZED QUERY
exports.getAllWisata = async (req, res) => {
  try {
    const sql = `
      SELECT
        w.*,
        COALESCE(l.total_likes, 0) AS total_likes,
        COALESCE(f.total_favorit, 0) AS total_favorit,
        COALESCE(r.average_rating, 0) AS average_rating
      FROM wisata w
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_likes
        FROM likes
        GROUP BY wisata_id
      ) l ON w.id = l.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_favorit
        FROM favorit
        GROUP BY wisata_id
      ) f ON w.id = f.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as average_rating
        FROM rating
        GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
    `;

    const [result] = await db.query(sql);
    res.json(result);
  } catch (err) {
    console.error('Error get all wisata:', err);
    res.status(500).json({ message: 'Gagal mengambil data wisata', error: err.message });
  }
};

// 🟢 GET wisata by ID
exports.getWisataById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const sql = 'SELECT * FROM wisata WHERE id = ?';
    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Wisata tidak ditemukan' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error get wisata by id:', err);
    res.status(500).json({ message: 'Gagal mengambil detail wisata', error: err.message });
  }
};

// exports.updateEvent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { event } = req.body;

//     if (event === undefined) {
//       return res.status(400).json({ message: 'Field event wajib dikirim' });
//     }

//     const sql = `UPDATE wisata SET event = ? WHERE id = ?`;
//     await db.query(sql, [event, id]);

//     res.status(200).json({ message: 'Event berhasil diupdate' });
//   } catch (err) {
//     console.error('Error update event:', err);
//     res.status(500).json({ message: 'Gagal update event', error: err.message });
//   }
// };
