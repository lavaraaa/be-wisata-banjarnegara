const db = require('../db');

exports.getCF = async (req, res) => {
  let { userId } = req.params;
  if (!userId) userId = 0;

  try {
    // OPTIMIZED QUERY - Single query instead of multiple
    const sql = `
      SELECT
        w.*,
        COALESCE(likes_count, 0) AS total_likes,
        COALESCE(favorit_count, 0) AS total_favorit,
        COALESCE(avg_rating, 0) AS average_rating,
        (COALESCE(rating_sum, 0) + COALESCE(likes_count, 0) + COALESCE(favorit_count, 0)) AS cfScore
      FROM wisata w
      LEFT JOIN (
        SELECT wisata_id, SUM(rating) as rating_sum, COUNT(*) as rating_count
        FROM rating
        ${userId != 0 ? 'WHERE user_id != ?' : ''}
        GROUP BY wisata_id
      ) r ON w.id = r.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as likes_count FROM likes GROUP BY wisata_id
      ) l ON w.id = l.wisata_id
      LEFT JOIN (
        SELECT wisata_id, COUNT(*) as favorit_count FROM favorit GROUP BY wisata_id
      ) f ON w.id = f.wisata_id
      LEFT JOIN (
        SELECT wisata_id, AVG(rating) as avg_rating FROM rating GROUP BY wisata_id
      ) ar ON w.id = ar.wisata_id
      HAVING cfScore > 0
      ORDER BY cfScore DESC
      LIMIT 24
    `;

    const [results] = userId != 0
      ? await db.query(sql, [userId])
      : await db.query(sql);

    if (results.length === 0) {
      return res.json([]);
    }

    // Shuffle pool untuk tampil ke FE
    const shuffledPool = [...results].sort(() => 0.5 - Math.random());

    // Ambil 8 untuk FE
    const result = shuffledPool.slice(0, 8);

    res.json(result);

  } catch (err) {
    console.error('Error fetch CF:', err);
    res.status(500).json({ message: 'Error fetch CF', error: err.message });
  }
};
