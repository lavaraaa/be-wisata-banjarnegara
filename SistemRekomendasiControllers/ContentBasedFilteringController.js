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
  try {
    return JSON.parse(kategori).map(k => normalizeKategori(k));
  } catch {
    return [normalizeKategori(kategori)];
  }
};

exports.getCBF = (req, res) => {
  const { userId } = req.params;

  const sqlAll = `
      SELECT 
        w.*,
        (SELECT COUNT(*) FROM likes l WHERE l.wisata_id = w.id) AS total_likes,
        (SELECT COUNT(*) FROM favorit f WHERE f.wisata_id = w.id) AS total_favorit,
        (SELECT COALESCE(AVG(r.rating),0) FROM rating r WHERE r.wisata_id = w.id) AS average_rating
      FROM wisata w
    `;


  db.query(sqlAll, [userId], (err, allWisata) => {
    if (err) return res.status(500).json({ message: 'Error fetch wisata' });

    // Ambil history user rating >=4
    const sqlHistory = `
      SELECT w.*
      FROM rating r
      JOIN wisata w ON r.wisata_id = w.id
      WHERE r.user_id = ? AND r.rating >= 4
      ORDER BY r.rating DESC, r.created_at DESC
    `;

  db.query(sqlHistory, [userId, userId, userId], (err2, userHistory) => { 
      if (err2) return res.status(500).json({ message: 'Error fetch user history' });

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
      const userHistoryKategori = userHistory.map(h => parseKategori(h.kategori));

      // Hitung skor wisata
      let scoredWisata = allWisata.map(w => {
        let cbfScore = 0;
        const wKategori = parseKategori(w.kategori);

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

      // ROTASI 2–3 refresh
      if (!global.cbfState) global.cbfState = {};
      const stateKey = `cbf_${userId}`;
      if (!global.cbfState[stateKey]) global.cbfState[stateKey] = { shift: 0, count: 0 };

      let { shift, count } = global.cbfState[stateKey];
      count++;
      if (count > 2) { // 2–3 refresh baru geser
        count = 0;
        shift = (shift + 3) % pool.length; // geser 3 wisata setiap rotasi
      }
      global.cbfState[stateKey].shift = shift;
      global.cbfState[stateKey].count = count;

      // ambil 8 card untuk FE
      const rotated = pool.slice(shift).concat(pool.slice(0, shift));
      const result = rotated.slice(0, 8);

      res.json(result);
    });
  });
};
