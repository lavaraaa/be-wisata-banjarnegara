const db = require('../db');

// Fungsi bantu parse kategori aman dan normalisasi sesuai daftar kategori
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

exports.getCBF = async (req, res) => {
  const { userId } = req.params;

  try {
    // OPTIMIZED QUERY - Single query with all data
    const sqlAll = `
      SELECT
        w.*,
        COALESCE(l.total_likes, 0) AS total_likes,
        COALESCE(f.total_favorit, 0) AS total_favorit,
        COALESCE(r.average_rating, 0) AS average_rating,
        ur.rating AS user_rating,
        COALESCE(k.kategori_relasi, '') AS kategori_relasi
      FROM wisata w
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_likes FROM likes GROUP BY wisata_id
      ) l ON w.id = l.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as total_favorit FROM favorit GROUP BY wisata_id
      ) f ON w.id = f.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as average_rating FROM rating GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
      LEFT JOIN (
        SELECT wisata_id, rating FROM rating WHERE user_id = ?
      ) ur ON w.id = ur.wisata_id
      LEFT JOIN (
        SELECT
          wk.wisata_id,
          GROUP_CONCAT(DISTINCT kw.nama ORDER BY kw.nama SEPARATOR '||') AS kategori_relasi
        FROM wisata_kategori wk
        JOIN kategori_wisata kw ON wk.kategori_id = kw.id
        GROUP BY wk.wisata_id
      ) k ON w.id = k.wisata_id
    `;

    const [allWisata] = await db.query(sqlAll, [userId]);

    // Ambil history user rating >=4
    const sqlHistory = `
      SELECT
        w.*,
        COALESCE(k.kategori_relasi, '') AS kategori_relasi
      FROM rating r
      JOIN wisata w ON r.wisata_id = w.id
      LEFT JOIN (
        SELECT
          wk.wisata_id,
          GROUP_CONCAT(DISTINCT kw.nama ORDER BY kw.nama SEPARATOR '||') AS kategori_relasi
        FROM wisata_kategori wk
        JOIN kategori_wisata kw ON wk.kategori_id = kw.id
        GROUP BY wk.wisata_id
      ) k ON w.id = k.wisata_id
      WHERE r.user_id = ? AND r.rating >= 4
      ORDER BY r.rating DESC, r.created_at DESC
    `;

    const [userHistory] = await db.query(sqlHistory, [userId]);

    if (!userHistory.length) {
      // user baru → top 8 by popularity
      const top8 = allWisata
        .map(w => {
          const popularityScore = (w.total_likes || 0) + (w.total_favorit || 0) + (w.user_rating || 0);
          return { ...w, totalScore: popularityScore };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 8);
      return res.json(top8);
    }

    // parse kategori user history
    const userHistoryKategori = userHistory.map(h => parseKategori(h.kategori_relasi || h.kategori));

    // Hitung skor wisata
    let scoredWisata = allWisata.map(w => {
      let cbfScore = 0;
      const wKategori = parseKategori(w.kategori_relasi || w.kategori);

      // cek judul → dominan
      const wJudul = (w.judul || '').toLowerCase().split(' ');
      userHistory.forEach(h => {
        const hJudul = (h.judul || '').toLowerCase().split(' ');
        const judulSim = wJudul.filter(word => hJudul.includes(word)).length;
        cbfScore += judulSim * 5; // judul lebih dominan
      });

      // cek kategori → tambahan
      let matched = false;
      userHistoryKategori.forEach(hKategori => {
        const commonKategori = wKategori.filter(k => hKategori.includes(k)).length;
        if (commonKategori > 0) {
          cbfScore += commonKategori * 3; // kategori tambahan
          matched = true;
        }
      });

      // popularity = like + favorit + rating user sendiri
      const popularityScore = (w.total_likes || 0) + (w.total_favorit || 0) + (w.user_rating || 0);

      return { ...w, cbfScore, popularityScore, totalScore: cbfScore + popularityScore, matched };
    });

    // pool → semua wisata yang relevan
    let pool = scoredWisata.filter(w => w.totalScore > 0);

    // jika pool <8 → tambahkan wisata lain by totalScore
    if (pool.length < 8) {
      const extra = scoredWisata
        .filter(w => !pool.includes(w))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 8 - pool.length);
      pool = pool.concat(extra);
    }

    // urutkan pool by totalScore
    pool.sort((a, b) => b.totalScore - a.totalScore);

    // ROTASI 2–3 refresh - WITH MEMORY LEAK FIX
    if (!global.cbfState) {
      global.cbfState = new Map();
      global.cbfStateMaxSize = 100; // max 100 users
    }

    // Cleanup old entries if exceeds max size
    if (global.cbfState.size > global.cbfStateMaxSize) {
      const firstKey = global.cbfState.keys().next().value;
      global.cbfState.delete(firstKey);
    }

    const stateKey = `cbf_${userId}`;
    if (!global.cbfState.has(stateKey)) {
      global.cbfState.set(stateKey, { shift: 0, count: 0 });
    }

    let { shift, count } = global.cbfState.get(stateKey);
    count++;
    if (count > 2) { // 2–3 refresh baru geser
      count = 0;
      shift = (shift + 3) % pool.length; // geser 3 wisata setiap rotasi
    }
    global.cbfState.set(stateKey, { shift, count });

    // ambil 8 card untuk FE
    const rotated = pool.slice(shift).concat(pool.slice(0, shift));
    const result = rotated.slice(0, 8);

    res.json(result);
  } catch (err) {
    console.error('Error fetch CBF:', err);
    res.status(500).json({ message: 'Error fetch CBF', error: err.message });
  }
};
