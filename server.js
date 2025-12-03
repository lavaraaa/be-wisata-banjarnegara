const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const wisataRoutes = require('./routes/wisataRoutes');

const likeRoutes = require('./routes/likeRoutes');
const favoritRoutes = require('./routes/favoritRoutes');
const  userActionRoutes= require('./routes/userActionRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const komentarRoutes = require('./routes/komentarRoutes');
const laporanKomentarRoutes = require('./routes/laporanKomentarRoutes');

const sistemRekomendasiRoutes = require('./SistemRekomendasiRoutes/SistemRekomendasiRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Buat folder uploads kalau belum ada
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Gunakan semua routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', wisataRoutes);
app.use('/api', likeRoutes);
app.use('/api', favoritRoutes);
app.use('/api', userActionRoutes);
app.use('/api', ratingRoutes);
app.use('/api', komentarRoutes);
app.use('/api', laporanKomentarRoutes); 
app.use('/api/rekomendasi', sistemRekomendasiRoutes);

// Static file untuk akses gambar, dll
app.use('/uploads', express.static(uploadsDir));

// Jalankan server
app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});

