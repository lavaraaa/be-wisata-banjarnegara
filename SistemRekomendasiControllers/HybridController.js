const db = require('../db');
const CBF = require('./ContentBasedFilteringController');
const CBFbyWisata = require('./CBFbyWisataController');
const CF = require('./CollaborativeFilteringController');

exports.getHybrid = async (req, res) => {
  const { userId } = req.params; // userId optional, guest = 0

  try {
    // 1. Ambil semua wisata
    const sqlAll = `
      SELECT 
        w.*,
        (SELECT COUNT(*) FROM likes l WHERE l.wisata_id = w.id) AS total_likes,
        (SELECT COUNT(*) FROM favorit f WHERE f.wisata_id = w.id) AS total_favorit,
        (SELECT COALESCE(AVG(r.rating),0) FROM rating r WHERE r.wisata_id = w.id) AS average_rating
      FROM wisata w
    `;
    const allWisata = await new Promise((resolve, reject) => {
      db.query(sqlAll, (err, results) => (err ? reject(err) : resolve(results)));
    });

    // 2. Ambil CBF user
    let cbfUser = [];
    if (userId && userId != 0) {
      cbfUser = await new Promise((resolve, reject) => {
        CBF.getCBF({ params: { userId } }, { json: resolve });
      });
    }

    // 3. Ambil CF (popularitas)
    const cf = allWisata.map(w => {
      const score = (w.total_likes || 0) + (w.total_favorit || 0) + (w.average_rating || 0);
      return { ...w, cfScore: score };
    });

    // 4. Gabungkan semua → Hybrid
    const combined = allWisata.map(w => {
      let score = 0;
      // CBF user
      const u = cbfUser.find(u => u.id === w.id);
      if (u) score += (u.totalScore || 0) * 0.5;
      // CF
      const c = cf.find(c => c.id === w.id);
      if (c) score += (c.cfScore || 0) * 0.5;
      return { ...w, hybridScore: score };
    });

    // 5. Filter >0 dan urutkan
    let pool = combined.filter(w => w.hybridScore > 0).sort((a,b) => b.hybridScore - a.hybridScore);

    // 6. Rotasi tiap 2–3 refresh - WITH MEMORY LEAK FIX
    if (!global.hybridState) {
      global.hybridState = new Map();
      global.hybridStateMaxSize = 100; // max 100 users
    }

    // Cleanup old entries if exceeds max size
    if (global.hybridState.size > global.hybridStateMaxSize) {
      const firstKey = global.hybridState.keys().next().value;
      global.hybridState.delete(firstKey);
    }

    const stateKey = `hybrid_${userId || 0}`;
    if (!global.hybridState.has(stateKey)) {
      global.hybridState.set(stateKey, { shift: 0, count: 0 });
    }

    let { shift, count } = global.hybridState.get(stateKey);
    count++;
    if (count > 2) {
      count = 0;
      shift = (shift + 3) % pool.length;
    }
    global.hybridState.set(stateKey, { shift, count });

    // 7. Ambil 8 wisata teratas
    const rotated = pool.slice(shift).concat(pool.slice(0, shift));
    const result = rotated.slice(0,12);

    res.json(result);

  } catch (err) {
    console.error('Gagal fetch hybrid:', err);
    res.status(500).json({ message: 'Error fetch hybrid' });
  }
};
