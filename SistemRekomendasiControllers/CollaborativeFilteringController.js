const db = require('../db');

exports.getCF = async (req, res) => {
  let { userId } = req.params;
  if (!userId) userId = 0;

  try {
    // 1. Ambil semua wisata + like, favorit, average rating
    const sqlAll = `
      SELECT 
        w.*,
        (SELECT COUNT(*) FROM likes l WHERE l.wisata_id = w.id) AS total_likes,
        (SELECT COUNT(*) FROM favorit f WHERE f.wisata_id = w.id) AS total_favorit,
        (SELECT COALESCE(AVG(r.rating),0) FROM rating r WHERE r.wisata_id = w.id) AS average_rating
      FROM wisata w
    `;
    const allWisata = await new Promise((resolve, reject) => {
      db.query(sqlAll, (err, results) => err ? reject(err) : resolve(results));
    });

    // 2. Ambil rating semua user selain user ini
    const sqlRatings = userId != 0 
      ? `SELECT * FROM rating WHERE user_id != ?`
      : `SELECT * FROM rating`;
    const ratings = await new Promise((resolve, reject) => {
      db.query(sqlRatings, userId != 0 ? [userId] : [], (err, results) => err ? reject(err) : resolve(results));
    });

    // 3. Hitung CF score
    const scoredWisata = allWisata.map(w => {
      const wisataRatings = ratings.filter(r => r.wisata_id === w.id);
      const ratingScore = wisataRatings.reduce((sum,r) => sum + r.rating, 0);
      const totalLikes = w.total_likes || 0;
      const totalFavorit = w.total_favorit || 0;
      const cfScore = ratingScore + totalLikes + totalFavorit;
      return { ...w, cfScore };
    });

    // 4. Filter yang cfScore > 0
    const positiveScore = scoredWisata.filter(w => w.cfScore > 0);

    if (!positiveScore.length) return res.json([]); // kalau ga ada yang >0, kosong

    // 5. Urut dari tertinggi untuk memilih top 24
    const sorted = positiveScore.sort((a,b) => b.cfScore - a.cfScore || b.id - a.id);

    // 6. Ambil pool: max 24 atau semua kalau <24
    const pool = sorted.length > 24 ? sorted.slice(0,24) : sorted;

    // 7. Acak pool untuk tampil ke FE
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());

    // 8. Ambil 8 untuk FE
    const result = shuffledPool.slice(0,8);

    res.json(result);

  } catch (err) {
    console.error('Gagal fetch CF:', err);
    res.status(500).json({ message: 'Error fetch CF' });
  }
};
