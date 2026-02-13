SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS kategori_wisata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kategori_wisata_nama (nama)
) COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wisata_kategori (
  wisata_id INT NOT NULL,
  kategori_id INT NOT NULL,
  PRIMARY KEY (wisata_id, kategori_id),
  KEY idx_wisata_kategori_wisata_id (wisata_id),
  KEY idx_wisata_kategori_kategori_id (kategori_id),
  CONSTRAINT fk_wisata_kategori_wisata
    FOREIGN KEY (wisata_id) REFERENCES wisata (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_wisata_kategori_kategori
    FOREIGN KEY (kategori_id) REFERENCES kategori_wisata (id)
    ON DELETE RESTRICT
) COLLATE = utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS tmp_wisata_kategori;
CREATE TEMPORARY TABLE tmp_wisata_kategori (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  wisata_id INT NOT NULL,
  nama VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL
) COLLATE = utf8mb4_unicode_ci;

INSERT INTO tmp_wisata_kategori (wisata_id, nama)
SELECT
  w.id,
  TRIM(JSON_UNQUOTE(JSON_EXTRACT(w.kategori, CONCAT('$[', seq.n, ']')))) AS nama
FROM wisata w
JOIN (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
  UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
  UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
) seq ON seq.n < CASE
  WHEN JSON_VALID(w.kategori) = 1
    AND JSON_TYPE(JSON_EXTRACT(w.kategori, '$')) = 'ARRAY'
  THEN JSON_LENGTH(w.kategori)
  ELSE 0
END
WHERE w.kategori IS NOT NULL
  AND w.kategori <> ''
  AND CASE
    WHEN JSON_VALID(w.kategori) = 1
    THEN JSON_TYPE(JSON_EXTRACT(w.kategori, '$'))
    ELSE NULL
  END = 'ARRAY';

INSERT INTO tmp_wisata_kategori (wisata_id, nama)
SELECT
  w.id,
  TRIM(JSON_UNQUOTE(JSON_EXTRACT(w.kategori, '$'))) AS nama
FROM wisata w
WHERE w.kategori IS NOT NULL
  AND w.kategori <> ''
  AND CASE
    WHEN JSON_VALID(w.kategori) = 1
    THEN JSON_TYPE(JSON_EXTRACT(w.kategori, '$'))
    ELSE NULL
  END = 'STRING';

INSERT INTO tmp_wisata_kategori (wisata_id, nama)
SELECT
  w.id,
  TRIM(w.kategori) AS nama
FROM wisata w
WHERE w.kategori IS NOT NULL
  AND w.kategori <> ''
  AND JSON_VALID(w.kategori) = 0;

DELETE FROM tmp_wisata_kategori
WHERE nama IS NULL OR nama = '';

INSERT INTO kategori_wisata (nama)
SELECT DISTINCT t.nama
FROM tmp_wisata_kategori t
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

INSERT IGNORE INTO wisata_kategori (wisata_id, kategori_id)
SELECT t.wisata_id, k.id
FROM tmp_wisata_kategori t
JOIN kategori_wisata k
  ON k.nama COLLATE utf8mb4_unicode_ci = t.nama COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
