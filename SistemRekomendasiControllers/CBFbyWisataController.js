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
  try {
    return JSON.parse(kategori).map(k => normalizeKategori(k));
  } catch {
    return [normalizeKategori(kategori)];
  }
};

// Normalisasi judul
const normalizeWords = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/gi,'').split(' ');

exports.getCBFbyWisata = (req, res) => {
  const { wisataId } = req.params;
  if (!wisataId) return res.status(400).json({ message: 'wisataId required' });

  // Ambil semua wisata kecuali referensi
  const sqlAll = `
    SELECT 
      w.*,
      (SELECT COUNT(*) FROM likes l WHERE l.wisata_id = w.id) AS total_likes,
      (SELECT COUNT(*) FROM favorit f WHERE f.wisata_id = w.id) AS total_favorit,
      (SELECT COALESCE(AVG(r.rating),0) FROM rating r WHERE r.wisata_id = w.id) AS avg_rating
    FROM wisata w
    WHERE w.id != ?
  `;

  db.query(sqlAll, [wisataId], (err, allWisata) => {
    if (err) return res.status(500).json({ message: 'Error fetch wisata' });

    // Ambil referensi wisata
    const sqlRef = `SELECT * FROM wisata WHERE id = ?`;
    db.query(sqlRef, [wisataId], (err2, refRows) => {
      if (err2 || !refRows.length) return res.status(500).json({ message: 'Error fetch ref wisata' });

      const refWisata = refRows[0];
      const refKategori = parseKategori(refWisata.kategori);
      const refJudulWords = normalizeWords(refWisata.judul);

      // Hitung skor kemiripan + popularity
      const scored = allWisata.map(w => {
        const wKategori = parseKategori(w.kategori);
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
    });
  });
};
