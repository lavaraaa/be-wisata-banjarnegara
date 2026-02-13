const db = require('../db');

// Normalisasi kategori
const normalizeKategori = (k) => {
  if (!k) return '';
  const str = k.toLowerCase();
  if (str.includes('curug') || str.includes('air terjun')) return 'curug/air terjun';
  if (str.includes('dieng')) return 'dieng';
  if (str.includes('wisata alam')) return 'wisata alam';
  if (str.includes('wisata budaya')) return 'wisata budaya';
  if (str.includes('wisata rekreasi')) return 'wisata rekreasi';
  if (str.includes('wisata kuliner')) return 'wisata kuliner';
  if (str.includes('wisata edukasi')) return 'wisata edukasi';
  if (str.includes('waduk')) return 'waduk';
  if (str.includes('desa wisata')) return 'desa wisata';
  if (str.includes('wisata religi')) return 'wisata religi';
  return str;
};

// Parse kategori
const parseKategori = (kategori) => {
  if (!kategori) return [];
  if (Array.isArray(kategori)) return kategori.map(k => normalizeKategori(k));
  if (typeof kategori === 'string' && kategori.includes('||')) {
    return kategori
      .split('||')
      .map((k) => normalizeKategori(k))
      .filter(Boolean);
  }
  try {
    return JSON.parse(kategori).map(k => normalizeKategori(k));
  } catch {
    return [normalizeKategori(kategori)];
  }
};

// Normalisasi judul
const normalizeWords = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/gi,'').split(' ');

exports.getCBFbyWisata = async (req, res) => {
  try {
    const { wisataId } = req.params;
    if (!wisataId) return res.status(400).json({ message: 'wisataId required' });

    // OPTIMIZED QUERY - Use LEFT JOIN instead of subquery
    const sqlAll = `
      SELECT
        w.*,
        COALESCE(l.total_likes, 0) AS total_likes,
        COALESCE(f.total_favorit, 0) AS total_favorit,
        COALESCE(r.avg_rating, 0) AS avg_rating,
        COALESCE(k.kategori_relasi, '') AS kategori_relasi
      FROM wisata w
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_likes FROM likes GROUP BY wisata_id
      ) l ON w.id = l.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_favorit FROM favorit GROUP BY wisata_id
      ) f ON w.id = f.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
      LEFT JOIN (
        SELECT
          wk.wisata_id,
          GROUP_CONCAT(DISTINCT kw.nama ORDER BY kw.nama SEPARATOR '||') AS kategori_relasi
        FROM wisata_kategori wk
        JOIN kategori_wisata kw ON wk.kategori_id = kw.id
        GROUP BY wk.wisata_id
      ) k ON w.id = k.wisata_id
      WHERE w.id != ?
    `;

    const [allWisata] = await db.query(sqlAll, [wisataId]);

    // Ambil referensi wisata
    const sqlRef = `
      SELECT
        w.*,
        COALESCE(k.kategori_relasi, '') AS kategori_relasi
      FROM wisata w
      LEFT JOIN (
        SELECT
          wk.wisata_id,
          GROUP_CONCAT(DISTINCT kw.nama ORDER BY kw.nama SEPARATOR '||') AS kategori_relasi
        FROM wisata_kategori wk
        JOIN kategori_wisata kw ON wk.kategori_id = kw.id
        GROUP BY wk.wisata_id
      ) k ON w.id = k.wisata_id
      WHERE w.id = ?
    `;
    const [refRows] = await db.query(sqlRef, [wisataId]);

    if (!refRows.length) {
      return res.status(404).json({ message: 'Wisata referensi tidak ditemukan' });
    }

    const refWisata = refRows[0];
    const refKategori = parseKategori(refWisata.kategori_relasi || refWisata.kategori);
    const refJudulWords = normalizeWords(refWisata.judul);

    // Hitung skor kemiripan + popularity
    const scored = allWisata.map(w => {
      const wKategori = parseKategori(w.kategori_relasi || w.kategori);
      const wJudulWords = normalizeWords(w.judul);

      const judulSim = wJudulWords.filter(word => refJudulWords.includes(word)).length;
      const kategoriSim = wKategori.filter(k => refKategori.includes(k)).length;

      const similarityScore = judulSim * 5 + kategoriSim * 3;
      const popularityScore = (w.total_likes || 0) + (w.total_favorit || 0) + (w.avg_rating || 0);

      return { ...w, similarityScore, popularityScore, totalScore: similarityScore + popularityScore };
    });

    // Filter relevan
    let pool = scored.filter(w => w.similarityScore > 0);

    // Jika kurang dari 8, ambil sisanya dari pool tertinggi
    if (pool.length < 8) {
      const extra = scored
        .filter(w => !pool.includes(w))
        .sort((a,b) => b.totalScore - a.totalScore)
        .slice(0, 8 - pool.length);
      pool = pool.concat(extra);
    }

    // Urutkan pool by totalScore
    pool.sort((a,b) => b.totalScore - a.totalScore);

    // ROTASI hasil tiap request supaya beda tiap refresh
    const shift = Math.floor(Math.random() * pool.length);
    const rotated = pool.slice(shift).concat(pool.slice(0, shift));
    const result = rotated.slice(0, 8);

    res.json(result);
  } catch (err) {
    console.error('Error getCBFbyWisata:', err);
    res.status(500).json({ message: 'Error fetch recommendation', error: err.message });
  }
};
