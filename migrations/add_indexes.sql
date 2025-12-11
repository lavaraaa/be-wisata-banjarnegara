-- ===============================================
-- Database Indexes Migration
-- Wisata Banjarnegara Backend
--
-- Tujuan: Meningkatkan performance query database
--
-- IMPORTANT: Backup database sebelum run migration ini!
-- ===============================================

-- Cek indexes yang sudah ada
-- Run query ini dulu untuk memastikan index belum ada:
-- SHOW INDEX FROM likes;
-- SHOW INDEX FROM favorit;
-- SHOW INDEX FROM rating;
-- SHOW INDEX FROM wisata;
-- SHOW INDEX FROM users;

-- ===============================================
-- LIKES TABLE INDEXES
-- ===============================================
-- Index untuk query yang filter by wisata_id
CREATE INDEX IF NOT EXISTS idx_likes_wisata
ON likes(wisata_id);

-- Index untuk query yang filter by user_id
CREATE INDEX IF NOT EXISTS idx_likes_user
ON likes(user_id);

-- Composite index untuk query yang filter by both
CREATE INDEX IF NOT EXISTS idx_likes_user_wisata
ON likes(user_id, wisata_id);

-- ===============================================
-- FAVORIT TABLE INDEXES
-- ===============================================
-- Index untuk query yang filter by wisata_id
CREATE INDEX IF NOT EXISTS idx_favorit_wisata
ON favorit(wisata_id);

-- Index untuk query yang filter by user_id
CREATE INDEX IF NOT EXISTS idx_favorit_user
ON favorit(user_id);

-- Composite index untuk query yang filter by both
CREATE INDEX IF NOT EXISTS idx_favorit_user_wisata
ON favorit(user_id, wisata_id);

-- ===============================================
-- RATING TABLE INDEXES
-- ===============================================
-- Index untuk query yang filter by wisata_id
CREATE INDEX IF NOT EXISTS idx_rating_wisata
ON rating(wisata_id);

-- Index untuk query yang filter by user_id
CREATE INDEX IF NOT EXISTS idx_rating_user
ON rating(user_id);

-- Composite index untuk query yang filter by both
-- PALING PENTING untuk check if user already rated
CREATE INDEX IF NOT EXISTS idx_rating_user_wisata
ON rating(user_id, wisata_id);

-- Index untuk ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_rating_created
ON rating(created_at);

-- Composite index untuk query di ContentBasedFilteringController
-- WHERE user_id = ? AND rating >= 4
CREATE INDEX IF NOT EXISTS idx_rating_user_score
ON rating(user_id, rating);

-- ===============================================
-- WISATA TABLE INDEXES
-- ===============================================
-- Index untuk kategori (jika TEXT, pakai prefix length)
-- Adjust prefix length sesuai kebutuhan (255 adalah max)
CREATE INDEX IF NOT EXISTS idx_wisata_kategori
ON wisata(kategori(255));

-- Index untuk kode_wilayah jika sering digunakan untuk filter
CREATE INDEX IF NOT EXISTS idx_wisata_kode_wilayah
ON wisata(kode_wilayah);

-- Index untuk koordinat jika ada geo-based search
CREATE INDEX IF NOT EXISTS idx_wisata_coordinates
ON wisata(latitude, longitude);

-- ===============================================
-- USERS TABLE INDEXES
-- ===============================================
-- Index untuk login (email)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Index untuk login (username) - BINARY untuk case-sensitive
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- Index untuk filter by role
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- ===============================================
-- VERIFY INDEXES
-- ===============================================
-- Setelah run migration, verify dengan:
-- SHOW INDEX FROM likes;
-- SHOW INDEX FROM favorit;
-- SHOW INDEX FROM rating;
-- SHOW INDEX FROM wisata;
-- SHOW INDEX FROM users;

-- ===============================================
-- PERFORMANCE TESTING
-- ===============================================
-- Test query performance sebelum dan sesudah:
--
-- EXPLAIN SELECT * FROM likes WHERE wisata_id = 1;
-- EXPLAIN SELECT * FROM rating WHERE user_id = 1 AND wisata_id = 1;
-- EXPLAIN SELECT * FROM rating WHERE user_id = 1 AND rating >= 4;
--
-- Cari "Using index" atau "Using where; Using index" di output
-- Hindari "Using filesort" atau "Using temporary"

-- ===============================================
-- ROLLBACK (jika diperlukan)
-- ===============================================
-- Untuk menghapus indexes jika ada masalah:
--
-- DROP INDEX idx_likes_wisata ON likes;
-- DROP INDEX idx_likes_user ON likes;
-- DROP INDEX idx_likes_user_wisata ON likes;
-- DROP INDEX idx_favorit_wisata ON favorit;
-- DROP INDEX idx_favorit_user ON favorit;
-- DROP INDEX idx_favorit_user_wisata ON favorit;
-- DROP INDEX idx_rating_wisata ON rating;
-- DROP INDEX idx_rating_user ON rating;
-- DROP INDEX idx_rating_user_wisata ON rating;
-- DROP INDEX idx_rating_created ON rating;
-- DROP INDEX idx_rating_user_score ON rating;
-- DROP INDEX idx_wisata_kategori ON wisata;
-- DROP INDEX idx_wisata_kode_wilayah ON wisata;
-- DROP INDEX idx_wisata_coordinates ON wisata;
-- DROP INDEX idx_users_email ON users;
-- DROP INDEX idx_users_username ON users;
-- DROP INDEX idx_users_role ON users;
